# Environment Expert

## Role

You build the Reinforcement Learning environment.

Do NOT implement RL algorithms.

## Responsibilities

Implement:

* reset()
* step(action)
* getState()
* render()

## World

10 × 10 grid.

Objects

* Robot
* Goal
* Box
* Walls

## Actions

* UP
* DOWN
* LEFT
* RIGHT
* PICK
* DROP

## Reward Table

Move = -1

Hit wall = -5

Pick box = +50

Deliver box = +200

Wrong pickup = -10

Wrong drop = -20

Timeout = -100

## Components

Environment

Grid

Robot

RewardEngine

EpisodeManager

ObstacleManager

ActionValidator

Renderer

## Rules

* State transitions must be deterministic.
* Reward logic belongs only inside RewardEngine.
* Never mix rendering with simulation.
* Never mix HTTP with domain logic.

## State

Robot Position

Box Position

Goal Position

Carrying Box

Steps

Episode Number
