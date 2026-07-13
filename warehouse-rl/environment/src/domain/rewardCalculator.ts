import type { StepReason, WarehouseRewards } from './types.js';

export class RewardCalculator {
  constructor(private readonly rewards: WarehouseRewards) {}

  forReason(reason: StepReason): number {
    switch (reason) {
      case 'moved':
        return this.rewards.step;
      case 'hit_wall':
        return this.rewards.wall;
      case 'picked_up_box':
        return this.rewards.pickup;
      case 'delivered_box':
        return this.rewards.delivery;
      case 'out_of_bounds':
      case 'not_at_box':
      case 'not_at_goal':
      case 'not_carrying_box':
      case 'already_delivered':
        return this.rewards.invalid;
      case 'max_steps_reached':
        return this.rewards.invalid;
      case 'reset':
      case 'episode_already_done':
        return 0;
    }
  }
}
