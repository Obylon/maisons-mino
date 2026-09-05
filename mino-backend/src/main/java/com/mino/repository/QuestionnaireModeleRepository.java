package com.mino.repository;

import com.mino.model.QuestionnaireModele;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionnaireModeleRepository extends JpaRepository<QuestionnaireModele, String> {
    boolean existsByNom(String nom);
}
