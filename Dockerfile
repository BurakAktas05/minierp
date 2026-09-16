# =========================================================================
# MiniERP All-in-One Multi-Stage Production Dockerfile (Railway & Cloud)
# Frontend (React + Vite) + Backend (Spring Boot 3 + Java 21)
# =========================================================================

# -------------------------------------------------------------------------
# Aşama 1: Frontend Derleme (React + TypeScript + Vite)
# -------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------------------
# Aşama 2: Backend Derleme & Frontend Statik Varlık Paketleme (Spring Boot)
# -------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /app/backend

# Bağımlılıkları önbellekle
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B || true

# Kaynak kodları kopyala
COPY backend/src ./src

# Frontend aşamasından derlenen dist dosyalarını Spring Boot static dizinine entegre et
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Testleri atlayarak JAR paketini üret
RUN mvn clean package -DskipTests -B && \
    cp $(find target -maxdepth 1 -name "*.jar" ! -name "*original*" | head -n 1) /app/app.jar

# -------------------------------------------------------------------------
# Aşama 3: Hafif Güvenli Runtime (Eclipse Temurin JRE 21)
# -------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Sadece üretilen nihai JAR dosyasını kopyala
COPY --from=backend-builder /app/app.jar app.jar

# Güvenlik için non-root kullanıcı
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Railway varsayılan dinamik PORT değişkenini kullanır
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -jar app.jar"]
