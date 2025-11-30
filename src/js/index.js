// 游戏主入口文件
// 整合所有组件并初始化游戏

// 确保DOM加载完成后再执行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}

function initGame() {
    try {
        // 创建性能监控对象
        const performanceMonitor = {
            startTime: performance.now(),
            frames: 0,
            lastFrameTime: performance.now(),
            
            // 记录关键操作性能
            measureOperation(name, callback) {
                const start = performance.now();
                const result = callback();
                const duration = performance.now() - start;
                if (duration > 50) {
                    console.warn(`性能警告: ${name} 操作耗时 ${duration.toFixed(2)}ms`);
                }
                return result;
            },
            
            // 更新帧率统计
            updateFps() {
                this.frames++;
                const now = performance.now();
                if (now - this.lastFrameTime >= 1000) {
                    const fps = this.frames * 1000 / (now - this.lastFrameTime);
                    this.frames = 0;
                    this.lastFrameTime = now;
                    // 只在FPS较低时显示警告
                    if (fps < 30) {
                        console.warn(`性能警告: FPS 降至 ${fps.toFixed(1)}`);
                    }
                }
            }
        };
        
        // 存储在全局对象中以便调试
        window.performanceMonitor = performanceMonitor;
        
        // 设置请求动画帧循环以监控性能
        function performanceLoop() {
            performanceMonitor.updateFps();
            requestAnimationFrame(performanceLoop);
        }
        performanceLoop();
        
        // 隐藏加载指示器
        function hideLoadingIndicator() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
        
        // 延迟初始化游戏以提高首屏加载速度
        setTimeout(async () => {
            // 使用性能监控测量游戏初始化
            performanceMonitor.measureOperation('游戏初始化', async () => {
                // 预加载资源
                await preloadAssets();
                
                // 创建游戏实例
                window.game = new Game();
                
                // 初始化UI组件
                window.uiComponents = new UIComponents(window.game);
                
                // 初始化交互系统
                window.interactionSystem = new InteractionSystem(window.game);
                
                // 初始化Katago接口（确保在Game对象创建之后）
                window.katagoInterface = new KatagoInterface();
                window.game.setKatagoInterface(window.katagoInterface);
                
                // 隐藏加载指示器
                hideLoadingIndicator();
                
                // 更新游戏状态消息
                const gameMessage = document.getElementById('game-message');
                if (gameMessage) {
                    gameMessage.textContent = '游戏已准备就绪';
                }
                
                // 初始化完成通知已通过UI更新实现
                
                console.log('游戏初始化完成');
            });
        }, 500);
        
        // 设置错误处理
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handlePromiseRejection);
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏加载失败，请刷新页面重试');
    }
}

// 全局错误处理
function handleError(event) {
    console.error('未捕获的错误:', event.error);
    
    // 使用alert显示错误，避免任何DOM操作
    if (typeof alert === 'function') {
        alert('发生错误，请刷新页面重试');
    }
    
    // 阻止默认行为
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
}

// Promise 错误处理
function handlePromiseRejection(event) {
    console.error('未处理的 Promise 错误:', event.reason);
    
    // 尝试显示错误通知
    if (window.game && typeof window.game.showNotification === 'function') {
        window.game.showNotification('操作失败，请重试', 'error');
    }
    
    // 阻止默认行为
    event.preventDefault();
}

// 资源预加载函数
function preloadAssets() {
    return new Promise((resolve) => {
        // 预加载可能的图像资源
        const images = [];
        let loadedImages = 0;
        
        if (images.length === 0) {
            resolve();
            return;
        }
        
        images.forEach(src => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedImages++;
                if (loadedImages === images.length) {
                    resolve();
                }
            };
            img.onerror = () => {
                loadedImages++;
                console.warn(`图像加载失败: ${src}`);
                if (loadedImages === images.length) {
                    resolve();
                }
            };
        });
    });
}

// 节流函数 - 优化高频事件处理
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 防抖函数 - 优化延迟执行
function debounce(func, wait) {
    let timeout;
    return function() {
        const args = arguments;
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 添加到全局，供其他模块使用
window.throttle = throttle;
window.debounce = debounce;
