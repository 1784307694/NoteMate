# 构建阶段
FROM node:20-alpine as build-stage

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine as production-stage

# 复制构建产物到nginx目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 