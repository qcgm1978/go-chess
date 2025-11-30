// Katago接口测试脚本
console.log('测试脚本已加载，等待游戏初始化...');

// 添加到全局，方便手动测试
window.testKatago = async () => {
    try {
        console.log('开始手动测试Katago接口...');
        
        // 检查Katago接口是否已加载
        if (!window.katagoInterface) {
            console.error('Katago接口未加载');
            return;
        }
        
        console.log('1. 初始化Katago接口...');
        const initialized = await window.katagoInterface.initialize();
        console.log('初始化结果:', initialized ? '成功' : '失败');
        
        if (!initialized) {
            console.warn('请确保Katago服务器正在运行: node katago-server.js');
            console.warn('服务器地址: http://localhost:3000');
        }
        
        console.log('2. 检查服务器状态...');
        const status = await window.katagoInterface.checkStatus();
        console.log('服务器状态:', status);
        
        // 测试游戏集成
        if (window.game) {
            console.log('3. 测试游戏中的Katago集成...');
            // 设置接口引用
            if (!window.game.katagoInterface) {
                window.game.setKatagoInterface(window.katagoInterface);
            }
            
            // 尝试获取领土估计
            console.log('4. 获取领土估计...');
            const estimate = await window.game.getTerritoryEstimateFromKatago();
            console.log('领土估计结果:', estimate);
        }
        
        console.log('\nKatago接口测试完成!');
        console.log('提示: 要使用此功能，请确保:');
        console.log('1. Katago已正确安装在: /opt/homebrew/Cellar/katago/1.16.4/');
        console.log('2. Katago服务器正在运行: node katago-server.js');
        console.log('3. 浏览器能够访问 http://localhost:3000');
        
    } catch (error) {
        console.error('测试过程中出现错误:', error);
    }
};

console.log('测试脚本已加载，请在游戏初始化完成后手动调用 window.testKatago() 进行测试');

// 添加到全局，方便手动测试
window.testKatago = async () => {
    try {
        console.log('手动测试Katago接口...');
        if (!window.katagoInterface) {
            console.error('Katago接口未加载');
            return;
        }
        
        const status = await window.katagoInterface.checkStatus();
        console.log('服务器状态:', status);
        
        if (window.game) {
            const estimate = await window.game.getTerritoryEstimateFromKatago();
            console.log('领土估计:', estimate);
        }
    } catch (error) {
        console.error('手动测试失败:', error);
    }
};

console.log('测试脚本已加载，可通过 window.testKatago() 手动测试');