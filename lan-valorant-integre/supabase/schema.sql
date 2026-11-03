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