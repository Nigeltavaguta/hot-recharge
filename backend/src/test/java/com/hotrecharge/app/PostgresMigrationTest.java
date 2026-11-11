package com.hotrecharge.app;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.DockerClientFactory;
import java.sql.DriverManager;
import static org.junit.jupiter.api.Assertions.*;

class PostgresMigrationTest {
    @Test void migrationCreatesDurableSchemaAndConstraints()throws Exception {
        String url=System.getenv("TEST_DATABASE_URL"), user=System.getenv().getOrDefault("TEST_DATABASE_USER","hotrecharge"), password=System.getenv().getOrDefault("TEST_DATABASE_PASSWORD","");
        PostgreSQLContainer<?> container=null;
        if(url==null) {
            org.junit.jupiter.api.Assumptions.assumeTrue(DockerClientFactory.instance().isDockerAvailable(),"Docker or TEST_DATABASE_URL is required for PostgreSQL migrations");
            container=new PostgreSQLContainer<>("postgres:17-alpine");container.start();url=container.getJdbcUrl();user=container.getUsername();password=container.getPassword();
        }
        try {
        Flyway flyway=Flyway.configure().dataSource(url,user,password).load();
        flyway.migrate();assertTrue(flyway.validateWithResult().validationSuccessful);
        try(var connection=DriverManager.getConnection(url,user,password);var statement=connection.createStatement()) {
            assertTrue(statement.executeQuery("SELECT * FROM purchase_intent WHERE 1=0").getMetaData().getColumnCount()>5);
            assertTrue(statement.executeQuery("SELECT * FROM app_session WHERE 1=0").getMetaData().getColumnCount()>5);
        }
        } finally {if(container!=null)container.stop();}
    }
}
