# tbw-yaminogemu

## Overview
tbw-yaminogemu is a decentralized game platform where players can challenge each other with meme coins. It features a streamlined process for creating, accepting, and finalizing game challenges. The platform ensures fair play and transparency using blockchain technology.

### Features
#### Initialize (Init):

Assigns the owner of the platform.
Sets up the environment for managing supported meme coins.
#### Add:

Allows the owner to add new types of supported meme coins.
Expands the platform's compatibility with different tokens.
#### Create:

Players can deposit an amount to create a new game.
Sets up a challenge for others to accept.
#### Refund:

Allows a player to quit an ongoing game.
Players can reclaim their deposited funds if the game has not been accepted by another player.
#### Take:

Enables other players to accept a game challenge.
Requires the challenger to deposit the same amount as the creator.
#### Finalize:

Concludes the game by sending the result back to the platform.
Distributes funds to the winner based on the game result.

## Install, Build, Deploy and Test

Let's run the test once to see what happens.

### Install `anchor`

First, make sure that `anchor` is installed:

Install `avm`:

```bash
$ cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
...
```

Install latest `anchor` version:

```bash
$ avm install 0.30.1
...
$ avm use 0.30.1
...
```

#### Verify the Installation

Check if Anchor is successfully installed:

```bash
$ anchor --version
anchor-cli 0.30.1
```

### Install Dependencies

Next, install dependencies:

```
$ yarn
```

### Build `anchor-escrow`

#### Update `program_id`

Get the public key of the deploy key. This keypair is generated automatically so a different key is exptected:

```bash
$ anchor keys list
anchor_escrow: Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS
```

Replace the default value of `program_id` with this new value:

```toml
# Anchor.toml

[programs.devnet]
tbw-yaminogemu = "DEzojzrGnQ7x2ZoFdSBZV52yF8FZRrouVJhqXoXRvvnz"

...
```

```rust
// lib.rs

...

declare_id!("DEzojzrGnQ7x2ZoFdSBZV52yF8FZRrouVJhqXoXRvvnz");

...
```

Build the program:

```
$ anchor build
```

### Deploy `tbw-yaminogemu`

Let's deploy the program. Notice that `tbw-yaminogemu` will be deployed on devnet:

```
$ solana config set --url devnet
...
```

```
$ anchor deploy
...

Program Id: DEzojzrGnQ7x2ZoFdSBZV52yF8FZRrouVJhqXoXRvvnz

Deploy success
```

Finally, run the test:

```
$ anchor test --skip-deploy --skip-build --skip-local-validator
```
