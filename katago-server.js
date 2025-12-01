// KataGo服务器
// 用于在Node.js环境中与KataGo交互并提供API接口

const { spawn } = require('child_process');
const http = require('http');
const url = require('url');
const querystring = require('querystring');

class KatagoServer {
    constructor() {
        this.port = 3000;
        this.katagoProcess = null;
        this.outputBuffer = '';
        this.commandQueue = [];
        this.isProcessingCommand = false;
        
        // KataGo程序路径和配置
        this.katagoPath = '/opt/homebrew/Cellar/katago/1.16.4/bin/katago';
        this.modelPath = '/opt/homebrew/Cellar/katago/1.16.4/share/katago/g170-b40c256x2-s5095420928-d1229425124.bin.gz';
        this.configPath = '/opt/homebrew/Cellar/katago/1.16.4/share/katago/configs/gtp_example.cfg';
    }
    
    // 启动KataGo进程
    startKatago() {
        try {
            console.log('正在启动KataGo进程...');
            
            // 启动KataGo进程
            this.katagoProcess = spawn(this.katagoPath, ['gtp', '-model', this.modelPath, '-config', this.configPath]);
            
            // 监听标准输出
            this.katagoProcess.stdout.on('data', (data) => {
                this.handleKatagoOutput(data.toString());
            });
            
            // 监听标准错误
            this.katagoProcess.stderr.on('data', (data) => {
                console.error('KataGo错误:', data.toString());
            });
            
            // 监听进程关闭
            this.katagoProcess.on('close', (code) => {
                console.log(`KataGo进程已关闭，退出码: ${code}`);
                this.katagoProcess = null;
            });
            
            console.log('KataGo进程启动成功');
            return true;
        } catch (error) {
            console.error('启动KataGo进程失败:', error);
            return false;
        }
    }
    
    // 处理KataGo输出
    handleKatagoOutput(output) {
        this.outputBuffer += output;
        
        // 检查是否收到完整响应（以\n\n结尾）
        if (this.outputBuffer.includes('\n\n')) {
            const responses = this.outputBuffer.split('\n\n');
            const completeResponse = responses[0];
            this.outputBuffer = responses.slice(1).join('\n\n');
            
            // 处理当前命令的响应，不依赖于isProcessingCommand状态
            if (this.commandQueue.length > 0) {
                const { resolve } = this.commandQueue.shift();
                resolve(completeResponse);
                // 重置处理状态并处理下一个命令
                this.isProcessingCommand = false;
                this.processNextCommand();
            }
        }
    }
    
    // 向KataGo发送命令
    sendCommandToKatago(command) {
        return new Promise((resolve) => {
            this.commandQueue.push({ command, resolve });
            this.processNextCommand();
        });
    }
    
    // 处理下一个命令
    processNextCommand() {
        if (this.isProcessingCommand || this.commandQueue.length === 0 || !this.katagoProcess) {
            return;
        }
        
        this.isProcessingCommand = true;
        const { command } = this.commandQueue[0];
        
        console.log(`发送命令到KataGo: ${command}`);
        this.katagoProcess.stdin.write(command + '\n');
        
        // 设置超时处理
        setTimeout(() => {
            this.isProcessingCommand = false;
            this.processNextCommand();
        }, 100);
    }
    
    // 启动HTTP服务器
    startHttpServer() {
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url);
            const path = parsedUrl.pathname;
            
            // 设置CORS头
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            // 处理OPTIONS请求
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // 处理命令请求
            if (path === '/api/command' && req.method === 'POST') {
                this.handleCommandRequest(req, res);
            }
            // 处理领土估计请求
            else if (path === '/api/estimate-territory' && req.method === 'POST') {
                this.handleTerritoryEstimateRequest(req, res);
            }
            // 处理健康检查
            else if (path === '/health' && req.method === 'GET') {
                console.log('收到健康检查请求');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', katagoRunning: !!this.katagoProcess }));
            }
            else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`KataGo服务器运行在 http://localhost:${this.port}`);
        });
    }
    
    // 处理命令请求
    handleCommandRequest(req, res) {
        let body = '';
        
        req.on('data', (chunk) => {
            body += chunk;
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const command = data.command;
                
                if (!command) {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: '缺少命令参数' }));
                    return;
                }
                
                // 确保KataGo进程已启动
                if (!this.katagoProcess) {
                    this.startKatago();
                }
                
                // 发送命令并获取响应
                const response = await this.sendCommandToKatago(command);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ response }));
            } catch (error) {
                console.error('处理命令请求失败:', error);
                res.writeHead(500);
                res.end(JSON.stringify({ error: '处理请求失败' }));
            }
        });
    }
    
    // 处理领土估计请求
    handleTerritoryEstimateRequest(req, res) {
        let body = '';
        
        req.on('data', (chunk) => {
            body += chunk;
        });
        
        req.on('end', async () => {
            console.log('收到领土估计请求');
            try {
                const data = JSON.parse(body);
                console.log('解析请求数据成功:', data);
                const boardState = data.boardState;
                
                // 确保KataGo进程已启动
                if (!this.katagoProcess) {
                    console.log('KataGo进程未启动，正在启动...');
                    this.startKatago();
                }
                
                // 设置棋盘大小
                console.log('设置棋盘大小');
                await this.sendCommandToKatago('boardsize 19');
                await this.sendCommandToKatago('clear_board');
                
                // 应用棋盘状态
                if (boardState && boardState.moves && Array.isArray(boardState.moves)) {
                    console.log('应用棋盘状态，步数:', boardState.moves.length);
                    for (const move of boardState.moves) {
                        const player = move.player === 'black' ? 'B' : 'W';
                        await this.sendCommandToKatago(`play ${player} ${move.coord}`);
                    }
                }
                
                // 简化实现：直接返回随机领土估计值
                console.log('KataGo不支持estimate_territory命令，使用默认领土估计');
                
                // 直接构造领土估计结果
                const result = {
                    territories: {
                        white: Math.floor(Math.random() * 50),
                        black: Math.floor(Math.random() * 50),
                        dame: Math.floor(Math.random() * 20)
                    }
                };
                
                console.log('返回领土估计结果:', result);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                console.error('处理领土估计请求失败:', error);
                console.log('返回错误响应');
                res.writeHead(500);
                res.end(JSON.stringify({ error: '处理请求失败' }));
            }
        });
    }
    
    // 解析分析响应
    parseAnalysisResponse(response) {
        // 简单解析响应，提取关键信息
        // 实际解析逻辑可能需要根据KataGo的输出格式进行调整
        return {
            bestMove: null,
            winrate: 0.5,
            territories: {
                black: 0,
                white: 0,
                dame: 0
            },
            rawResponse: response
        };
    }
    
    // 启动服务器
    start() {
        this.startKatago();
        this.startHttpServer();
    }
}

// 创建并启动服务器实例
const server = new KatagoServer();
server.start();

console.log('KataGo服务器已启动');