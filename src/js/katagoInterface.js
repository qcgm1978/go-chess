// KatagoInterface with territory estimation support using kata-analyze command
window.KatagoInterface = function() {
    this.serverUrl = 'http://localhost:3000';
    
    // 添加getTerritoryEstimate方法，调用真实服务器API
    this.getTerritoryEstimate = async function(boardState) {
        try {
            console.log('请求KataGo领土估计，棋盘状态:', boardState ? boardState.moves.length : 0);
            
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
            
            // 确保返回的领土数据符合预期格式
            if (data.territories && typeof data.territories === 'object') {
                const territories = data.territories;
                // 确保每个字段都有值
                return {
                    white: territories.white || 0,
                    black: territories.black || 0,
                    dame: territories.dame || 0
                };
            }
            
            // 如果数据格式不符合预期，返回默认值
            console.warn('KataGo返回的数据格式不符合预期');
            return { white: 0, black: 0, dame: 0 };
        } catch (error) {
            console.error('获取领土估计失败:', error.message);
            // 出错时返回默认值
            return { white: 0, black: 0, dame: 0 };
        }
    };
};

window.katagoInterface = new window.KatagoInterface();
