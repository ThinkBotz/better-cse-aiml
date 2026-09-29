#!/bin/bash
sed -i '182,206d' src/components/LoginView.tsx
# Now the file is shorter. We need to find "showPinPrompt ?" and delete until ") : !isSignUp ?"
sed -i '/{showPinPrompt ? (/,/) : !isSignUp ? (/c\
        {!isSignUp ? (' src/components/LoginView.tsx
