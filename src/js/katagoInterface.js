// KatagoInterface with territory estimation support
window.KatagoInterface = function() {
    this.serverUrl = 'http://localhost:3000';
    
    // 添加getTerritoryEstimate方法，调用真实服务器API
    this.getTerritoryEstimate = async function(boardState) {
        try {
            // 调用服务器API获取领土估计
            const response = await fetch(`${this.serverUrl}/api/estimate-territory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ boardState: boardState || { moves: [] } })
            });
            
            console.log('KataGo服务器响应状态:', response.status);
            
            if (!response.ok) {
                throw new Error(`服务器响应错误: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('成功获取KataGo领土估计数据:', data);
            
            // 返回领土估计数据
            return data.territories || { white: 0, black: 0, dame: 0 };
        } catch (error) {
            console.error('获取领土估计失败:', error.message);
            // 出错时返回默认值
            return { white: 0, black: 0, dame: 0 };
        }
    };
};

window.katagoInterface = new window.KatagoInterface();
