FROM node:20-alpine

WORKDIR /app

# 安装系统依赖（包括pdftotext、ffmpeg、yt-dlp）
RUN apk add --no-cache poppler-utils ffmpeg python3 py3-pip && \
    pip3 install --no-cache-dir yt-dlp

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --production

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads data

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
