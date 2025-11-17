#!/bin/bash
cd /home/kavia/workspace/code-generation/immersive-learning-platform-253126-253136/lms_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

