import AuthShell from "../../features/auth/components/AuthShell";
import SignupForm from "../../features/auth/components/SignupForm";

export default function CandidateSignup() {
  return (
    <AuthShell
      eyebrow="Candidate journey"
      steps={["Create your account", "Build your profile", "Apply to roles", "Track every application"]}
      activeStep={0}
    >
      <SignupForm
        role="candidate"
        heading="Start your job search"
        subheading="One profile, every application tracked in one place."
        switchTo={{ label: "Hiring instead?", to: "/signup/recruiter", linkText: "Create a recruiter account" }}
      />
    </AuthShell>
  );
}