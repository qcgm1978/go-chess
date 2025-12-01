#!/bin/bash

# 测试健康检查端点
echo "测试健康检查端点..."
curl -v http://localhost:3000/health

echo "\n\n测试领土估计端点..."
curl -v -X POST -H "Content-Type: application/json" -d '{"boardState":{"moves":[]}}' http://localhost:3000/api/estimate-territory