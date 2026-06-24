# just docs: https://github.com/casey/just
set shell       := ["bash", "-c"]
set dotenv-load := true
# minimal formatting, bold is very useful
bold                               := '\033[1m'
normal                             := '\033[0m'
green                              := "\\e[32m"
yellow                             := "\\e[33m"
blue                               := "\\e[34m"
magenta                            := "\\e[35m"
cyan                               := "\\e[36m"
grey                               := "\\e[90m"

_help:
    #!/usr/bin/env bash
    echo ""
    just --list --unsorted --list-heading $'🪐 framejs.io — nhost api + Deno Fresh worker. https://docs.nhost.io/:\n'
    echo -e ""
    echo -e "    Sub-commands: (just <sub-command> <command>)"
    echo -e "        {{cyan}}api{{normal}}        # nhost backend (api/): auth, Hasura, storage, migrations"
    echo -e "        {{cyan}}frontend{{normal}}   # Deno Fresh worker (frontend/worker), served at framejs.io"
    echo -e ""
    echo -e "    Links:"
    echo -e "        framejs.io:        {{green}}https://framejs.io/{{normal}}"
    echo -e "        local GraphQL:     {{green}}https://local.graphql.local.nhost.run/v1{{normal}}"
    echo -e "        local Hasura:      {{green}}https://local.hasura.local.nhost.run{{normal}}"
    echo -e ""

# Start the local dev stack: nhost api (background) + worker dev server (foreground)
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    just api/dev
    just frontend/dev

# Shut down the local api stack
@down +args="":
    just api/down {{args}}

# generate hasura graphql typescript types (needs api stack up + docker)
@generate:
    just frontend/generate

# type-check everything (currently the worker; api functions have no check yet)
@check:
    just frontend/check

# format everything
@fmt:
    just frontend/fmt

# Deletes caches, databases, certificates, etc.
@clean:
    just api/clean

# Run all existing 'just test' commands in the repo (uses justfile introspection)
test cwd="": check
    #!/usr/bin/env bash
    set -euo pipefail
    printf "\n"
    printf "🍓 Run ALL 'just test' commands in this repository:\n\n"
    for file in $(find * -type f -name justfile) ; do
        if [ "$file" = "justfile" ]; then
            continue
        fi
        if [[ "$file" == *"archive"* ]]; then
            continue
        fi
        justprefix="just $(echo $file | sed s/justfile//)"
        commands=$(just --justfile $file --dump --dump-format json | jq -r '.recipes | keys[]' | grep '^[^_]')
        commandArray=($commands)
        for command in "${commandArray[@]}" ; do
            COMMAND_FORMATTED=$(printf "   %$(echo $((${#file} - 7)))s $command")
            if [ "$command" = "test" ]; then
                fullCommand=$(printf "%s%s\n"  "$justprefix" "$command")
                echo -e "🍓  {{green}}$fullCommand{{normal}}"
                eval "$fullCommand"
            fi
        done
    done

# List ALL justfiles and commands in the repo
ls:
    #!/usr/bin/env bash
    set -euo pipefail
    printf "\n"
    printf "👀 ALL just commands in this repository:\n\n"
    for file in $(find * -type f -name justfile) ; do
        justprefix="just $(echo $file | sed s/justfile//)"
        commands=$(just --justfile $file --dump --dump-format json | jq -r '.recipes | keys[]' | grep '^[^_]')
        commandArray=($commands)
        # This just gets the first element, not totally clear why
        command="$commandArray"
        HELP=$(just --justfile $file --dump --dump-format json | jq -r --arg key "$command" '.recipes[$key].doc')
        justprefix="$justprefix$command"
        printf "%-40s {{blue}}# %s{{normal}}\n" "$justprefix" "$HELP"
        unset commandArray[0]
        for command in "${commandArray[@]}" ; do
            HELP=$(just --justfile $file --dump --dump-format json | jq -r --arg key "$command" '.recipes[$key].doc')
            COMMAND_FORMATTED=$(printf "   %$(echo $((${#file} - 7)))s $command")
            printf "%-40s {{blue}}# %s{{normal}}\n" "$COMMAND_FORMATTED" "$HELP"
        done
    done

###################################################
# Internal utilies
###################################################

alias api := _api
@_api +args="":
    just api/{{args}}

alias frontend := _frontend
@_frontend +args="":
    just frontend/{{args}}
