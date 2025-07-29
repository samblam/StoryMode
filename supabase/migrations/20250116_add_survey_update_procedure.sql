-- Create function to update survey with sound mappings in a transaction
CREATE OR REPLACE FUNCTION update_survey_with_sounds(
    survey_id UUID,
    survey_data JSONB,
    sound_mappings JSONB
) RETURNS JSONB AS $$
DECLARE
    updated_survey JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Log before updating survey
        RAISE NOTICE 'Updating survey with ID: %, data: %', survey_id, survey_data;
        -- Update main survey data
        UPDATE surveys
        SET
            title = COALESCE((survey_data->>'title')::TEXT, title),
            description = COALESCE((survey_data->>'description')::TEXT, description),
            client_id = COALESCE((survey_data->>'client_id')::UUID, client_id),
            sound_profile_id = COALESCE((survey_data->>'sound_profile_id')::UUID, sound_profile_id),
            video_url = COALESCE((survey_data->>'video_url')::TEXT, video_url),
            functions = COALESCE((survey_data->>'functions')::JSONB, functions),
            active = COALESCE((survey_data->>'active')::BOOLEAN, active),
            approved = COALESCE((survey_data->>'approved')::BOOLEAN, approved),
            visible_to_client = COALESCE((survey_data->>'visible_to_client')::BOOLEAN, visible_to_client),
            updated_at = NOW()
        WHERE id = update_survey_with_sounds.survey_id
        RETURNING to_jsonb(surveys.*) INTO updated_survey;

        -- Log after updating survey
        RAISE NOTICE 'Survey updated: %', updated_survey;

        -- Delete existing sound mappings
        DELETE FROM survey_sounds
        WHERE survey_sounds.survey_id = update_survey_with_sounds.survey_id;

        -- Insert new sound mappings if provided
        IF jsonb_array_length(sound_mappings) > 0 THEN
            INSERT INTO survey_sounds (
                survey_id,
                sound_id,
                intended_function,
                order_index
            )
            SELECT
                update_survey_with_sounds.survey_id,
                (mapping->>'sound_id')::UUID,
                mapping->>'intended_function',
                (mapping->>'order_index')::INTEGER
            FROM jsonb_array_elements(sound_mappings) AS mapping;
        END IF;

        -- Fetch updated survey with relationships
        SELECT to_jsonb(full_survey.*)
        INTO updated_survey
        FROM (
            SELECT
                s.id as id,  -- Changed from survey_id to just id to avoid ambiguity
                s.created_at as created_at,
                s.updated_at as updated_at,
                s.title as title,
                s.description as description,
                s.client_id as client_id,
                s.sound_profile_id as sound_profile_id,
                s.video_url as video_url,
                s.functions as functions,
                s.active as active,
                s.approved as approved,
                s.visible_to_client as visible_to_client,
                jsonb_agg(
                    jsonb_build_object(
                        'id', ss.id,
                        'sound_id', ss.sound_id,
                        'intended_function', ss.intended_function,
                        'order_index', ss.order_index,
                        'sounds', to_jsonb(snd.*)
                    )
                ) FILTER (WHERE ss.id IS NOT NULL) AS survey_sounds
            FROM surveys s
            LEFT JOIN survey_sounds ss ON s.id = ss.survey_id
            LEFT JOIN sounds snd ON ss.sound_id = snd.id
            WHERE s.id = update_survey_with_sounds.survey_id  -- Explicitly qualify the parameter reference
            GROUP BY s.id
        ) AS full_survey;

        RETURN updated_survey;
    EXCEPTION WHEN OTHERS THEN
        -- Rollback transaction on error
        RAISE EXCEPTION 'Failed to update survey: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;