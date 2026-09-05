package com.mino.repository;

import com.mino.model.Lecture;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LectureRepository extends JpaRepository<Lecture, String> {
    Optional<Lecture> findByUtilisateurIdAndCle(String utilisateurId, String cle);
}
