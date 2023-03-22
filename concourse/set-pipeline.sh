#!/bin/sh
# update the concourse pipeline with this script.

fly -t devex set-pipeline --pipeline js-driver-release-v10 --config concourse/pipeline.yml