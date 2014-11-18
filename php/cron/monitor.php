<?php
/**
 *
 * 页面性能检测: 部署在取样机上的脚本,用于想主机传送监控信息
 * you should deploy this scipt(with ../../automation folder) to a sub monitor machine,
 * then it can get the performace data and transfer it to the server, cron it like below:
 * /20 * * * * root /usr/bin/php /data1/pageMonitor/php/cron/monitor.php 1 >> /dev/null
 *
 **/
    const PARALLEL_PROC_CNT = 2;
    date_default_timezone_set('Asia/Shanghai');
    function get_machine_ip()
    {
        $cmd_status = 0;
        $cmd_output = array();
        $cmd = "/sbin/ifconfig | awk '/eth/{print \$0}' | wc -l";
        $cnt = shell_exec($cmd) - 1;
        if ($cnt < 0)
            return false;
        $cmd = "/sbin/ifconfig | grep -A1 eth{$cnt} | awk '/.*inet/{print \$2}' | awk -F: '{print \$2}' | head -n 1";
        $ret = trim(shell_exec($cmd));
        if (empty($ret))
        {
            // 对于非主流配置,就随便去个IP吧
            $cmd = "/sbin/ifconfig | grep -A1 eth | awk '/.*inet/{print \$2}' | awk -F: '{print \$2}' | head -n 1";
            $ret = trim(shell_exec($cmd));
        }
        return $ret;
    }

    $ip = get_machine_ip();
    if (empty($ip)) {
        echo "[" . date('Y-n-j H:i:s') . "] Can not get IP info from this machine!!!\n";
        exit;
    }
    $need_har = isset($argv[1]) ? $argv[1] : false;
    $basedir = dirname(__FILE__);
    $script_dir = $basedir . '/../../automation/modules/';
    $login_script_dir = $script_dir . 'automation_login.js';
    $no_cookie_monitor_script_dir = $script_dir . 'automation_monitor_without_cookies.js';
    $monitor_script_dir = $script_dir . 'automation_monitor_with_cookies.js';
    $save_surfix = $ip . '/' . date('Y/n/j/G/i/');
    $har_dir = $basedir . '/' . $save_surfix;
    $log_file = $basedir . '/../../log/rsync.log';
    $monitor_time = strtotime(date('Y-n-j G:i:00')) * 1000;

    // 获取所有的需要检测的url
    $result = file_get_contents("http://localhost/configure/getUrl");
    $result = json_decode($result, true);
    $no_login_addr = array();
    $login_addr = array();
    
    // 在检测之前对数据做处理，让使用同一个账户登陆的网址，在一个数组下
    // 这样可以减少频繁的更换登陆cookie的情况
    if (!isset($result['data'])) return;
    foreach ($result['data'] as $addr)
    {
        if (empty($addr['user']))
        {
            array_push($no_login_addr, $addr);
        } else {
            if (!isset($login_addr[$addr['user']])) 
                $login_addr[$addr['user']] = array();
            array_push($login_addr[$addr['user']], $addr);
        }
    }

    $child_cnt = 0;
    $status = NULL;
    // 对于需要登陆的, 先登录然后取数据
    foreach ($login_addr as $single_user_addr)
    {
        $child_cnt++;
        $pid = pcntl_fork();

        if ($pid == 0)
        {
            $login_flag = false;
            $monitor_result = array();
            foreach ($single_user_addr as $monitor_addr)
            {
                if (!$login_flag)
                {
                    $login_flag = true;
                    // echo "login {$monitor_addr['user']} {$monitor_addr['password']}\n";
                    $cmd = "casperjs {$login_script_dir} '{$monitor_addr['user']}' '{$monitor_addr['password']}'";
                    $res = shell_exec($cmd);
                    // if login fail, try again!
                    if (strstr($res, "error"))
                    {
                        $res = shell_exec($cmd);
                        // if login fail again, skip the page need this user!
                        if (strstr($res, "error"))
                            break;
                    }
                }
                // echo "{$monitor_addr['addr']}\n";
                $cmd = "casperjs {$monitor_script_dir} '{$monitor_addr['addr']}' time '{$monitor_addr['user']}' {$har_dir}" . $monitor_addr['_id'];
                if (!empty($monitor_addr['ua']))
                    $cmd .= " '{$monitor_addr['ua']}'";
                // echo $cmd ."\n";
                $tmp = shell_exec($cmd);
                $tmp = json_decode($tmp, true);
                $tmp = $tmp['metrics'];
                if (!$tmp['timeFrontend']) {
                    // echo $tmp . "\n";
                    continue;
                }
                $tmp['index'] = $monitor_addr['_id'];
                $tmp['timeFrontendRate'] = $tmp['timeFrontend'];
                $tmp['monitor_time'] = $monitor_time;
                $tmp['srcHost'] = $ip;
                unset($tmp['timeFrontend']);
                unset($tmp['timeBackend']);

                array_push($monitor_result, $tmp);
            }
            if (!empty($monitor_result)) {
                $data = 'data=' . json_encode($monitor_result);
                $ret = shell_exec("curl 'http://localhost/monitor/saveTiming' -d '" . $data . "' > /dev/null 2>&1");
            }
            // echo "{$data}\n";
            exit;
        }

        if ($child_cnt == PARALLEL_PROC_CNT) {
            pcntl_wait($status, WUNTRACED);
            $child_cnt--;
        }
    }

    // 不需要登陆的, 直接调用脚本取数据
    $monitor_result = array();
    foreach ($no_login_addr as $monitor_addr)
    {
        // echo "{$monitor_addr['addr']}\n";
        $cmd = "casperjs {$no_cookie_monitor_script_dir} '{$monitor_addr['addr']}' time {$har_dir}" . $monitor_addr['_id'];
        if (!empty($monitor_addr['ua']))
            $cmd .= " '{$monitor_addr['ua']}'";
        // echo $cmd ."\n";
        $tmp = shell_exec($cmd);
        $tmp = json_decode($tmp, true);
        $tmp = $tmp['metrics'];
        if (!$tmp['timeFrontend']) {
            // echo $tmp . "\n";
            continue;
        }
            
        $tmp['index'] = $monitor_addr['_id'];
        $tmp['timeFrontendRate'] = $tmp['timeFrontend'];
        $tmp['monitor_time'] = $monitor_time;
        $tmp['srcHost'] = $ip;
        unset($tmp['timeFrontend']);
        unset($tmp['timeBackend']);

        array_push($monitor_result, $tmp);
    }
    if (!empty($monitor_result)) {
        $data = 'data=' . json_encode($monitor_result);
        $ret = shell_exec("curl 'http://localhost/monitor/saveTiming' -d '" . $data . "' > /dev/null 2>&1");
    }
    // echo "{$data}\n";

    while ($child_cnt)
    {
        pcntl_wait($status, WUNTRACED);
        $child_cnt--;
    }

    // 如果需要则传输har文件至服务器
    if ($need_har == 1)
    {
        $rsync_ip = 'localhost';
        $cmd = "rsync -avz --timeout=120 {$basedir}/{$ip} {$rsync_ip}::monitor/ --port=7874 >> {$log_file}";
        // echo $cmd ."\n";
        shell_exec($cmd);
    }
    // 删除本地生成的har文件
    shell_exec("sync");
    shell_exec("rm -rf {$basedir}/{$ip}");


