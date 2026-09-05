package com.mino.repository;

import com.mino.model.QuestionModele;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionModeleRepository extends JpaRepository<QuestionModele, String> {
    List<QuestionModele> findByModeleIdOrderByOrdreAsc(String modeleId);
}
