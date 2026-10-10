package com.mino.repository;

import com.mino.model.EvaluationAtelier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EvaluationAtelierRepository extends JpaRepository<EvaluationAtelier, String> {
    List<EvaluationAtelier> findByAtelierId(String atelierId);
    List<EvaluationAtelier> findByMamanId(String mamanId);
    Optional<EvaluationAtelier> findByAtelierIdAndMamanId(String atelierId, String mamanId);
    boolean existsByAtelierIdAndMamanId(String atelierId, String mamanId);
}
