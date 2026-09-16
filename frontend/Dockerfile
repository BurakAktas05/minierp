# ==========================================
# Aşama 1: Node.js ile Frontend Derleme (Build)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Paket tanımlarını kopyala ve bağımlılıkları yükle
COPY package.json ./
RUN npm install

# Kaynak kodları kopyala ve üretim paketini derle
COPY . .
RUN npm run build

# ==========================================
# Aşama 2: Nginx ile Statik Dağıtım & API Proxy
# ==========================================
FROM nginx:1.27-alpine

# Nginx reverse proxy ayarlarını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Derlenen React uygulamasını Nginx web dizinine kopyala
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
