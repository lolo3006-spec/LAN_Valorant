-- Fichier de migration SQL pour les fonctions de gestion des comptes.
-- À copier dans Supabase → SQL Editor puis exécuter.

CREATE OR REPLACE FUNCTION public.supprimer_mon_compte()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current uuid;
  v_is_admin boolean;
  v_admin_count integer;
BEGIN
  v_current := auth.uid();

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  SELECT est_admin INTO v_is_admin
  FROM public.joueurs
  WHERE id = v_current;

  IF v_is_admin THEN
    SELECT count(*) INTO v_admin_count
    FROM public.joueurs
    WHERE est_admin = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Le dernier organisateur ne peut pas supprimer son compte';
    END IF;
  END IF;

  DELETE FROM public.membres_equipe WHERE joueur_id = v_current;
  DELETE FROM public.inscriptions WHERE joueur_id = v_current;
  DELETE FROM public.joueurs WHERE id = v_current;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_supprimer_compte(p_joueur uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current uuid;
  v_admin_count integer;
  v_is_target_admin boolean;
BEGIN
  v_current := auth.uid();

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.joueurs
    WHERE id = v_current
      AND est_admin = true
  ) THEN
    RAISE EXCEPTION 'Action réservée aux organisateurs';
  END IF;

  IF p_joueur IS NULL THEN
    RAISE EXCEPTION 'Compte invalide';
  END IF;

  SELECT est_admin INTO v_is_target_admin
  FROM public.joueurs
  WHERE id = p_joueur;

  IF v_is_target_admin THEN
    SELECT count(*) INTO v_admin_count
    FROM public.joueurs
    WHERE est_admin = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Impossible de supprimer le dernier organisateur';
    END IF;
  END IF;

  DELETE FROM public.membres_equipe WHERE joueur_id = p_joueur;
  DELETE FROM public.inscriptions WHERE joueur_id = p_joueur;
  DELETE FROM public.joueurs WHERE id = p_joueur;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_liste_comptes()
RETURNS TABLE (
  id uuid,
  nom text,
  prenom text,
  email text,
  pseudo text,
  est_admin boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.id, j.nom, j.prenom, j.email, j.pseudo, j.est_admin
  FROM public.joueurs j
  ORDER BY j.pseudo ASC;
$$;

CREATE OR REPLACE FUNCTION public.admin_definir_organisateur(p_joueur uuid, p_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current uuid;
  v_admin_count integer;
BEGIN
  v_current := auth.uid();

  IF v_current IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.joueurs
    WHERE id = v_current
      AND est_admin = true
  ) THEN
    RAISE EXCEPTION 'Action réservée aux organisateurs';
  END IF;

  IF p_joueur IS NULL THEN
    RAISE EXCEPTION 'Compte invalide';
  END IF;

  IF p_admin = false THEN
    SELECT count(*) INTO v_admin_count
    FROM public.joueurs
    WHERE est_admin = true;

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Il reste au moins un organisateur';
    END IF;
  END IF;

  UPDATE public.joueurs
  SET est_admin = p_admin
  WHERE id = p_joueur;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_creer_equipe(p_tournoi uuid, p_nom text, p_tag text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_equipe uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.joueurs
    WHERE id = auth.uid()
      AND est_admin = true
  ) THEN
    RAISE EXCEPTION 'Action réservée aux organisateurs';
  END IF;

  IF p_tournoi IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.tournois WHERE id = p_tournoi
  ) THEN
    RAISE EXCEPTION 'Tournoi introuvable';
  END IF;

  IF p_nom IS NULL OR length(btrim(p_nom)) NOT BETWEEN 2 AND 40 THEN
    RAISE EXCEPTION 'Le nom de l’équipe doit contenir entre 2 et 40 caractères';
  END IF;

  IF p_tag IS NULL OR btrim(p_tag) !~ '^[A-Za-z0-9]{2,4}$' THEN
    RAISE EXCEPTION 'Le tag doit contenir 2 à 4 lettres ou chiffres';
  END IF;

  INSERT INTO public.equipes (tournoi_id, nom, tag)
  VALUES (p_tournoi, btrim(p_nom), upper(btrim(p_tag)))
  RETURNING id INTO v_equipe;

  RETURN v_equipe;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_supprimer_equipe(p_equipe uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.joueurs
    WHERE id = auth.uid()
      AND est_admin = true
  ) THEN
    RAISE EXCEPTION 'Action réservée aux organisateurs';
  END IF;

  IF p_equipe IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.equipes WHERE id = p_equipe
  ) THEN
    RAISE EXCEPTION 'Équipe introuvable';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.matchs
    WHERE equipe_a_id = p_equipe OR equipe_b_id = p_equipe
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer une équipe déjà engagée dans un match';
  END IF;

  DELETE FROM public.membres_equipe WHERE equipe_id = p_equipe;
  DELETE FROM public.equipes WHERE id = p_equipe;
END;
$$;

DO $$
DECLARE
  v_format_type record;
  v_constraint record;
BEGIN
  SELECT n.nspname, t.typname, t.typtype
  INTO v_format_type
  FROM pg_attribute a
  JOIN pg_type t ON t.oid = a.atttypid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE a.attrelid = 'public.tournois'::regclass
    AND a.attname = 'format'
    AND NOT a.attisdropped;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Colonne public.tournois.format introuvable';
  END IF;

  IF v_format_type.typtype = 'e' THEN
    EXECUTE format(
      'ALTER TYPE %I.%I ADD VALUE IF NOT EXISTS %L',
      v_format_type.nspname,
      v_format_type.typname,
      '5v5'
    );
  END IF;

  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.tournois'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%format%'
      AND (
        pg_get_constraintdef(oid) ILIKE '%1v1%'
        OR pg_get_constraintdef(oid) ILIKE '%2v2%'
        OR pg_get_constraintdef(oid) ILIKE '%4v4%'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.tournois DROP CONSTRAINT %I', v_constraint.conname);
  END LOOP;

  IF v_format_type.typtype <> 'e' THEN
    ALTER TABLE public.tournois
      ADD CONSTRAINT tournois_format_supported_check
      CHECK (format IN ('1v1', '2v2', '4v4', '5v5'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_modifier_format_tournoi(p_tournoi uuid, p_format text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_statut text;
  v_format_actuel text;
  v_taille integer;
  v_type_format text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connexion requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.joueurs
    WHERE id = auth.uid()
      AND est_admin = true
  ) THEN
    RAISE EXCEPTION 'Action réservée aux organisateurs';
  END IF;

  IF p_format IS NULL OR p_format NOT IN ('1v1', '2v2', '4v4', '5v5') THEN
    RAISE EXCEPTION 'Format invalide';
  END IF;

  SELECT statut::text, format::text
  INTO v_statut, v_format_actuel
  FROM public.tournois
  WHERE id = p_tournoi
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tournoi introuvable';
  END IF;

  IF v_statut NOT IN ('brouillon', 'inscriptions', 'cloture') THEN
    RAISE EXCEPTION 'Le format ne peut plus être modifié après le lancement du tournoi';
  END IF;

  IF v_format_actuel = p_format THEN
    RETURN;
  END IF;

  v_taille := CASE p_format
    WHEN '1v1' THEN 1
    WHEN '2v2' THEN 2
    WHEN '4v4' THEN 4
    WHEN '5v5' THEN 5
  END;

  IF EXISTS (
    SELECT 1
    FROM public.equipes e
    JOIN public.membres_equipe me ON me.equipe_id = e.id
    WHERE e.tournoi_id = p_tournoi
    GROUP BY e.id
    HAVING count(*) > v_taille
  ) THEN
    RAISE EXCEPTION 'Une équipe dépasse la taille du format choisi. Modifiez sa composition avant de changer de format.';
  END IF;

  SELECT a.atttypid::regtype::text
  INTO v_type_format
  FROM pg_attribute a
  WHERE a.attrelid = 'public.tournois'::regclass
    AND a.attname = 'format'
    AND NOT a.attisdropped;

  EXECUTE 'UPDATE public.tournois SET format = $1::' || v_type_format || ' WHERE id = $2'
    USING p_format, p_tournoi;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_modifier_format_tournoi(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_modifier_format_tournoi(uuid, text) TO authenticated;
