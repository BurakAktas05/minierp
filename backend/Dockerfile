# ================================
# 1. Aşama: Maven ile Build
# ================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Önce sadece pom.xml'i kopyala -> bağımlılıkları cache'le
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Kaynak kodları kopyala ve derle
COPY src ./src
RUN mvn clean package -DskipTests -B

# ================================
# 2. Aşama: Hafif Runtime Image
# ================================
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Build aşamasından sadece jar'ı al
COPY --from=builder /app/target/*.jar app.jar

# Non-root kullanıcı (güvenlik best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
