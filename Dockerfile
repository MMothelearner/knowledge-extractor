FROM node:18.20.8-alpine

WORKDIR /app

# 安装系统依赖（包括pdftotext）
RUN apk add --no-cache poppler-utils

# 复制package文件
COPY package*.json ./

# 设置npm配置以加快安装速度
RUN npm config set fetch-timeout 120000 && npm config set fetch-retry-mintimeout 20000 && npm config set fetch-retry-maxtimeout 120000

# 安装依赖
RUN npm install --production --no-optional --legacy-peer-deps

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads data

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
