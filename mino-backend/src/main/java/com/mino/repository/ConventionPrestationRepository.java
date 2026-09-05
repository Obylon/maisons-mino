package com.mino.repository;

import com.mino.model.ConventionPrestation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConventionPrestationRepository extends JpaRepository<ConventionPrestation, String> {
    List<ConventionPrestation> findByProfessionnelId(String professionnelId);
}
