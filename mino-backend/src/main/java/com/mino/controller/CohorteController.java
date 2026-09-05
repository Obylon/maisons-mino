package com.mino.controller;

import com.mino.dto.CohorteDtos.CohorteRequest;
import com.mino.dto.CohorteDtos.CohorteResponse;
import com.mino.dto.CohorteDtos.MamanEnAttenteResponse;
import com.mino.model.Cohorte;
import com.mino.repository.CohorteRepository;
import com.mino.repository.MamanRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * CRUD complet sur les cohortes - reserve a la COORDINATRICE (voir SecurityConfig,
 * "/api/cohortes/**" -> ROLE_COORDINATRICE). Pas de logique d'isolation particuliere
 * ici : contrairement a Maman/PROM-PREM, une cohorte n'est pas une donnee sensible
 * individuelle, c'est un regroupement administratif.
 */
@RestController
@RequestMapping("/api/cohortes")
@RequiredArgsConstructor
@PreAuthorize("hasRole('COORDINATRICE')")
public class CohorteController {

    private final CohorteRepository cohorteRepository;
    private final MamanRepository mamanRepository;

    @PostMapping
    public ResponseEntity<CohorteResponse> creer(@Valid @RequestBody CohorteRequest request) {
        Cohorte cohorte = new Cohorte();
        cohorte.setNom(request.nom());
        cohorte.setVille(request.ville());
        cohorte.setDateDebut(request.dateDebut());
        cohorte.setDateFin(request.dateFin());
        cohorte = cohorteRepository.save(cohorte);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(cohorte));
    }

    @GetMapping
    public ResponseEntity<List<CohorteResponse>> lister() {
        List<CohorteResponse> cohortes = cohorteRepository.findAll()
                .stream().map(this::toResponse).toList();
        return ResponseEntity.ok(cohortes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CohorteResponse> obtenir(@PathVariable String id) {
        Cohorte cohorte = cohorteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cohorte introuvable : " + id));
        return ResponseEntity.ok(toResponse(cohorte));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CohorteResponse> modifier(@PathVariable String id,
                                                      @Valid @RequestBody CohorteRequest request) {
        Cohorte cohorte = cohorteRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Cohorte introuvable : " + id));
        cohorte.setNom(request.nom());
        cohorte.setVille(request.ville());
        cohorte.setDateDebut(request.dateDebut());
        cohorte.setDateFin(request.dateFin());
        cohorte = cohorteRepository.save(cohorte);
        return ResponseEntity.ok(toResponse(cohorte));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable String id) {
        if (!cohorteRepository.existsById(id)) {
            throw new NoSuchElementException("Cohorte introuvable : " + id);
        }
        cohorteRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    /** Mamans de cette cohorte pas encore rattachees a un groupe. */
    @GetMapping("/{id}/mamans-en-attente")
    public ResponseEntity<List<MamanEnAttenteResponse>> mamansEnAttente(@PathVariable String id) {
        if (!cohorteRepository.existsById(id)) {
            throw new NoSuchElementException("Cohorte introuvable : " + id);
        }
        List<MamanEnAttenteResponse> enAttente = mamanRepository.findByCohorteId(id).stream()
                .filter(m -> m.getGroupe() == null)
                .filter(m -> m.getUtilisateur().isActif())
                .map(m -> new MamanEnAttenteResponse(
                        m.getId(),
                        m.getUtilisateur().getId(),
                        m.getUtilisateur().getNom(),
                        m.getUtilisateur().getPrenom(),
                        m.getDateTermeGrossesse(),
                        m.getDateEntreeParcours()
                ))
                .toList();
        return ResponseEntity.ok(enAttente);
    }

    private CohorteResponse toResponse(Cohorte c) {
        return new CohorteResponse(c.getId(), c.getNom(), c.getVille(), c.getDateDebut(), c.getDateFin());
    }
}
