package com.mino.controller;

import com.mino.dto.QuestionnaireDtos.ModeleRequest;
import com.mino.dto.QuestionnaireDtos.ModeleResponse;
import com.mino.dto.QuestionnaireDtos.QuestionRequest;
import com.mino.dto.QuestionnaireDtos.QuestionResponse;
import com.mino.model.QuestionModele;
import com.mino.model.QuestionnaireModele;
import com.mino.repository.QuestionModeleRepository;
import com.mino.repository.QuestionnaireModeleRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * Modeles de questionnaires - permet a la coordinatrice de creer d'autres
 * questionnaires que PROM/PREM (satisfaction, bilan post-natal, etc). PROM et PREM
 * existent par defaut (voir migration 016) mais ne sont pas traites specialement -
 * ce sont juste les deux premiers modeles crees.
 */
@RestController
@RequestMapping("/api/questionnaire-modeles")
@RequiredArgsConstructor
public class QuestionnaireModeleController {

    private final QuestionnaireModeleRepository modeleRepository;
    private final QuestionModeleRepository questionRepository;

    @PostMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<ModeleResponse> creer(@Valid @RequestBody ModeleRequest request) {
        if (modeleRepository.existsByNom(request.nom())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(null);
        }
        QuestionnaireModele modele = new QuestionnaireModele();
        modele.setNom(request.nom());
        modele.setDescription(request.description());
        modele.setActif(true);
        modele = modeleRepository.save(modele);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(modele));
    }

    /** Tous les modeles (actifs et desactives) - vue admin. */
    @GetMapping
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<List<ModeleResponse>> lister() {
        List<ModeleResponse> modeles = modeleRepository.findAll().stream().map(this::toResponse).toList();
        return ResponseEntity.ok(modeles);
    }

    /** Seulement les modeles actifs - utilise par la maman pour choisir quel questionnaire remplir. */
    @GetMapping("/actifs")
    @PreAuthorize("hasAnyRole('MAMAN', 'PROFESSIONNEL', 'COORDINATRICE')")
    public ResponseEntity<List<ModeleResponse>> listerActifs() {
        List<ModeleResponse> modeles = modeleRepository.findAll().stream()
                .filter(QuestionnaireModele::isActif)
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(modeles);
    }

    @PutMapping("/{id}/desactiver")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<ModeleResponse> desactiver(@PathVariable String id) {
        QuestionnaireModele modele = modeleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Modele introuvable : " + id));
        modele.setActif(false);
        modele = modeleRepository.save(modele);
        return ResponseEntity.ok(toResponse(modele));
    }

    @PutMapping("/{id}/activer")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<ModeleResponse> activer(@PathVariable String id) {
        QuestionnaireModele modele = modeleRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Modele introuvable : " + id));
        modele.setActif(true);
        modele = modeleRepository.save(modele);
        return ResponseEntity.ok(toResponse(modele));
    }

    /** Ajoute une question a un modele existant. */
    @PostMapping("/{modeleId}/questions")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<QuestionResponse> ajouterQuestion(@PathVariable String modeleId,
                                                               @Valid @RequestBody QuestionRequest request) {
        QuestionnaireModele modele = modeleRepository.findById(modeleId)
                .orElseThrow(() -> new NoSuchElementException("Modele introuvable : " + modeleId));

        QuestionModele.TypeQuestion type;
        try {
            type = QuestionModele.TypeQuestion.valueOf(request.type());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Type de question invalide : " + request.type()
                    + " (attendu : TEXTE_LIBRE, CHOIX_UNIQUE ou ECHELLE_1_10)");
        }
        if (type == QuestionModele.TypeQuestion.CHOIX_UNIQUE
                && (request.options() == null || request.options().isBlank())) {
            throw new IllegalArgumentException("Les options sont requises pour une question a choix unique.");
        }

        QuestionModele question = new QuestionModele();
        question.setModele(modele);
        question.setTexte(request.texte());
        question.setType(type);
        question.setOptions(request.options());
        question.setOrdre(request.ordre());
        question = questionRepository.save(question);

        return ResponseEntity.status(HttpStatus.CREATED).body(toQuestionResponse(question));
    }

    /** Questions d'un modele, dans l'ordre - utilise par la maman pour afficher le formulaire. */
    @GetMapping("/{modeleId}/questions")
    @PreAuthorize("hasAnyRole('MAMAN', 'PROFESSIONNEL', 'COORDINATRICE')")
    public ResponseEntity<List<QuestionResponse>> listerQuestions(@PathVariable String modeleId) {
        List<QuestionResponse> questions = questionRepository.findByModeleIdOrderByOrdreAsc(modeleId)
                .stream().map(this::toQuestionResponse).toList();
        return ResponseEntity.ok(questions);
    }

    @DeleteMapping("/questions/{questionId}")
    @PreAuthorize("hasRole('COORDINATRICE')")
    public ResponseEntity<Void> supprimerQuestion(@PathVariable String questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new NoSuchElementException("Question introuvable : " + questionId);
        }
        questionRepository.deleteById(questionId);
        return ResponseEntity.noContent().build();
    }

    private QuestionResponse toQuestionResponse(QuestionModele q) {
        return new QuestionResponse(q.getId(), q.getTexte(), q.getType().name(), q.getOptions(), q.getOrdre());
    }

    private ModeleResponse toResponse(QuestionnaireModele m) {
        return new ModeleResponse(m.getId(), m.getNom(), m.getDescription(), m.isActif());
    }
}
