// 性能优化工具函数

// 内存管理器 - 防止内存泄漏
class MemoryManager {
    constructor() {
        this.objectRegistry = new Map();
        this.eventListeners = new Map();
    }
    
    // 注册对象以便后续清理
    registerObject(id, obj) {
        this.objectRegistry.set(id, obj);
    }
    
    // 注销对象并尝试释放内存
    unregisterObject(id) {
        if (this.objectRegistry.has(id)) {
            const obj = this.objectRegistry.get(id);
            // 尝试清理对象的引用
            if (typeof obj === 'object' && obj !== null) {
                // 清除可能的大数组
                for (const key in obj) {
                    if (Array.isArray(obj[key])) {
                        obj[key] = null;
                    } else if (typeof obj[key] === 'object') {
                        obj[key] = null;
                    }
                }
            }
            this.objectRegistry.delete(id);
        }
    }
    
    // 注册事件监听器以便后续移除
    registerEventListener(element, eventType, handler) {
        if (!this.eventListeners.has(element)) {
            this.eventListeners.set(element, []);
        }
        this.eventListeners.get(element).push({ eventType, handler });
    }
    
    // 清理所有注册的事件监听器
    clearEventListeners(element) {
        if (this.eventListeners.has(element)) {
            const listeners = this.eventListeners.get(element);
            listeners.forEach(({ eventType, handler }) => {
                if (element.removeEventListener) {
                    element.removeEventListener(eventType, handler);
                }
            });
            this.eventListeners.delete(element);
        }
    }
    
    // 全面清理
    cleanup() {
        // 清理所有对象引用
        this.objectRegistry.clear();
        
        // 清理所有事件监听器
        this.eventListeners.forEach((_, element) => {
            this.clearEventListeners(element);
        });
        
        // 触发垃圾回收（如果可用）
        if (window.gc && typeof window.gc === 'function') {
            try {
                window.gc();
            } catch (e) {
                console.warn('垃圾回收调用失败');
            }
        }
    }
}

// 渲染优化器
class RenderOptimizer {
    constructor() {
        this.isBatchUpdate = false;
        this.updateQueue = [];
        this.rafId = null;
    }
    
    // 开始批量更新
    startBatchUpdate() {
        this.isBatchUpdate = true;
    }
    
    // 结束批量更新并执行
    endBatchUpdate() {
        this.isBatchUpdate = false;
        this.flushUpdates();
    }
    
    // 调度更新
    scheduleUpdate(updateFunc) {
        if (this.isBatchUpdate) {
            this.updateQueue.push(updateFunc);
        } else {
            this.executeUpdate(updateFunc);
        }
    }
    
    // 执行单个更新
    executeUpdate(updateFunc) {
        // 使用requestAnimationFrame优化渲染
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        
        this.rafId = requestAnimationFrame(() => {
            try {
                updateFunc();
            } catch (e) {
                console.error('渲染更新失败:', e);
            } finally {
                this.rafId = null;
            }
        });
    }
    
    // 批量执行所有更新
    flushUpdates() {
        if (this.updateQueue.length === 0) return;
        
        const updates = [...this.updateQueue];
        this.updateQueue = [];
        
        this.executeUpdate(() => {
            updates.forEach(update => update());
        });
    }
    
    // 优化DOM操作 - 使用文档片段
    createOptimizedElement(tag, options = {}) {
        const fragment = document.createDocumentFragment();
        const element = document.createElement(tag);
        
        // 设置属性
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        // 设置类
        if (options.className) {
            element.className = options.className;
        }
        
        // 设置样式
        if (options.style) {
            Object.entries(options.style).forEach(([key, value]) => {
                element.style[key] = value;
            });
        }
        
        // 设置内容
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        // 添加子元素
        if (options.children) {
            options.children.forEach(child => {
                if (child instanceof Node) {
                    fragment.appendChild(child);
                }
            });
        }
        
        element.appendChild(fragment);
        return element;
    }
    
    // 使用虚拟DOM差异更新（简化版）
    diffUpdate(element, newContent) {
        // 简单实现：只有在内容确实变化时才更新
        if (element.textContent !== newContent) {
            element.textContent = newContent;
        }
    }
}

// 缓存管理器
class CacheManager {
    constructor() {
        this.cache = new Map();
        this.maxSize = 100; // 最大缓存项数
    }
    
    // 获取缓存
    get(key) {
        return this.cache.get(key);
    }
    
    // 设置缓存
    set(key, value) {
        // 如果缓存已满，移除最早的项
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    
    // 检查是否存在缓存
    has(key) {
        return this.cache.has(key);
    }
    
    // 清除特定缓存
    clear(key) {
        if (key !== undefined) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }
    
    // 使用缓存执行函数
    cachedExecution(key, func) {
        if (this.has(key)) {
            return this.get(key);
        }
        const result = func();
        this.set(key, result);
        return result;
    }
}

// 创建单例实例
const memoryManager = new MemoryManager();
const renderOptimizer = new RenderOptimizer();
const cacheManager = new CacheManager();

// 导出到全局对象，兼容浏览器环境
window.memoryManager = memoryManager;
window.renderOptimizer = renderOptimizer;
window.cacheManager = cacheManager;
window.MemoryManager = MemoryManager;
window.RenderOptimizer = RenderOptimizer;
window.CacheManager = CacheManager;
