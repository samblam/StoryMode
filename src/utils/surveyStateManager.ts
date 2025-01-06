interface SurveyState {
    currentStep: number;
    completedSteps: number[];
    matches: { [soundId: string]: string };
    isSubmitting: boolean;
}

const initialState: SurveyState = {
    currentStep: 1,
    completedSteps: [],
    matches: {},
    isSubmitting: false,
};

let state: SurveyState = { ...initialState };

export function getSurveyState(): SurveyState {
    return { ...state };
}

export function setSurveyState(newState: Partial<SurveyState>): void {
    state = { ...state, ...newState };
}

export function resetSurveyState(): void {
    state = { ...initialState };
}

export function markStepComplete(step: number): void {
    if (!state.completedSteps.includes(step)) {
        state.completedSteps.push(step);
    }
}

export function setMatch(soundId: string, functionId: string): void {
    state.matches[soundId] = functionId;
}

export function clearMatch(soundId: string): void {
    delete state.matches[soundId];
}

export function setSubmitting(isSubmitting: boolean): void {
    state.isSubmitting = isSubmitting;
}

export function moveToNextStep(): void {
    state.currentStep++;
}

export function moveToPreviousStep(): void {
    state.currentStep--;
}