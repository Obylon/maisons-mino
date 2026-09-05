package com.mino;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // necessaire pour AtelierRappelService (tache planifiee des rappels)
public class MinoApplication {
    public static void main(String[] args) {
        SpringApplication.run(MinoApplication.class, args);
    }
}
