#!/bin/sh
# update the concourse pipeline with this script.

fly -t devex set-pipeline --pipeline driver-fauna-js-release --config concourse/pipeline.yml