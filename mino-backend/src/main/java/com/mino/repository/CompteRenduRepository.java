package com.mino.repository;

import com.mino.model.CompteRendu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompteRenduRepository extends JpaRepository<CompteRendu, String> {
    List<CompteRendu> findByProfessionnelId(String professionnelId);
    List<CompteRendu> findByAtelierId(String atelierId);
}
