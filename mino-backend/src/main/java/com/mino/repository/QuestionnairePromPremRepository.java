package com.mino.repository;

import com.mino.model.QuestionnairePromPrem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionnairePromPremRepository extends JpaRepository<QuestionnairePromPrem, String> {
    /** Point d'accès central pour l'isolation : toujours filtrer par maman_id, jamais un findAll() brut côté service. */
    List<QuestionnairePromPrem> findByMamanId(String mamanId);
}
