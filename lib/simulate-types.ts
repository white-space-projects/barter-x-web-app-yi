// ==========================================
// Simulate API Types
// ==========================================

export type SimulateRequest = {
  users: number;
  offers: number;
  hooks: number;
  max_out: number;
  seed: number;
  dry_run: boolean;
};

export type SimulateResponse = {
  run_id: string;
  users_created: number;
  offers_created: number;
  hooks_created: number;
  max_possible_hooks: number;
  sample_user_ids: string[];
  sample_offer_ids: string[];
  sample_hook_pairs: [string, string][];
  note: string;
  status: "success" | "error";
  error?: string;
};
