# ================================
# 1. Aşama: Maven ile Build
# ================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Önce sadece pom.xml'i kopyala -> bağımlılıkları cache'le
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Kaynak kodları kopyala ve derle
COPY src ./src
RUN mvn clean package -DskipTests -B && cp $(find target -maxdepth 1 -name "*.jar" ! -name "*original*" | head -n 1) app.jar

# ================================
# 2. Aşama: Hafif Runtime Image
# ================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Build aşamasından tek jar'ı al
COPY --from=builder /app/app.jar app.jar

# Non-root kullanıcı (güvenlik best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "exec java ${JAVA_OPTS} -jar app.jar"]
