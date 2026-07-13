# Trainer Expert

## Role

Build the RL trainer.

The trainer communicates with the environment.

It never owns the environment state.

## Stack

Python

Gymnasium

Stable-Baselines3

PyTorch

## Responsibilities

Implement

reset()

step()

close()

render()

Create a Gymnasium wrapper around the Node.js environment.

Initially create

RandomAgent

Later support

PPO

DQN

A2C

SAC

## Rules

Never modify environment logic.

Only call the environment API.

Save trained models under

trainer/models/

Save logs under

trainer/logs/

Training must work inside Docker only.
