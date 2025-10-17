-- Create enum for game types
CREATE TYPE public.game_type AS ENUM ('mines', 'aviator', 'color_prediction');

-- Create game_credentials table for separate credentials per game
CREATE TABLE public.game_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  username TEXT NOT NULL,
  secret_code TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(username, game_type)
);

-- Enable RLS
ALTER TABLE public.game_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all game credentials"
  ON public.game_credentials
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert game credentials"
  ON public.game_credentials
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update game credentials"
  ON public.game_credentials
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete game credentials"
  ON public.game_credentials
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_game_credentials_updated_at
  BEFORE UPDATE ON public.game_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create game_sessions table to track which game user is accessing
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id UUID REFERENCES public.game_credentials(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Users can view their own sessions"
  ON public.game_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert sessions"
  ON public.game_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (true);