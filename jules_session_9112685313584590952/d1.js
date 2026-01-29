export async function getLessonById(db, lessonNumber) {
    try {
        const result = await db.prepare(` 
      SELECT  
        l.id, 
        l.sequence, 
        l.title, 
        l.tactical_concept, 
        l.module_id, 
        m.phase 
      FROM lessons l 
      JOIN modules m ON l.module_id = m.module_id 
      WHERE l.sequence = ? 
    `).bind(lessonNumber).first();
        return result || null;
    }
    catch (error) {
        console.error('D1 query failed:', error);
        return null;
    }
}
export async function getRelationships(db, lessonNumber) {
    try {
        // This is a simplified query - adjust based on your actual schema 
        const results = await db.prepare(` 
      SELECT  
        c1.term as source_concept, 
        c2.term as target_concept, 
        cr.relationship_type, 
        cr.logic_rationale 
      FROM concept_relationships cr 
      JOIN concepts c1 ON cr.source_concept_id = c1.concept_id 
      JOIN concepts c2 ON cr.target_concept_id = c2.concept_id 
      JOIN document_concepts dc ON c1.concept_id = dc.concept_id 
      WHERE dc.document_title LIKE ? 
    `).bind(`%L${lessonNumber.toString().padStart(2, '0')}%`).all();
        return results.results || [];
    }
    catch (error) {
        console.error('Relationships query failed:', error);
        return [];
    }
}
