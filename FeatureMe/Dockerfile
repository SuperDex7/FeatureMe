# Multi-stage Dockerfile for Spring Boot (Java 21)

# ===== Build stage =====
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Leverage dependency caching
COPY pom.xml .
RUN mvn -q -e -B -DskipTests dependency:go-offline

# Copy sources and build
COPY src ./src
RUN mvn -q -e -B -DskipTests package

# ===== Runtime stage =====
FROM eclipse-temurin:21-jre
WORKDIR /app

ENV JAVA_OPTS=""
ENV SERVER_PORT=8080
EXPOSE 8080

# Copy fat jar
COPY --from=build /app/target/*.jar /app/app.jar

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:${SERVER_PORT}/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${SERVER_PORT} -Djava.security.egd=file:/dev/./urandom -jar /app/app.jar"]
