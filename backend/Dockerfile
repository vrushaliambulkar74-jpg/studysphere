FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests

RUN mvn dependency:tree -Dincludes=org.postgresql:postgresql

RUN jar tf target/*.jar | grep "BOOT-INF/lib/postgresql-" || (echo "ERROR: PostgreSQL driver missing from packaged JAR" && exit 1)

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]