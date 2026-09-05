package com.mino.repository;

import com.mino.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, String> {
    List<Message> findByGroupeIdOrderByDateEnvoiAsc(String groupeId);
    List<Message> findByConversationIdOrderByDateEnvoiAsc(String conversationId);
    List<Message> findByExpediteurId(String expediteurId);
}
