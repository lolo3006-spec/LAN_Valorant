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