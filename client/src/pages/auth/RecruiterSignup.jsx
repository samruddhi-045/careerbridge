import AuthShell from "../../features/auth/components/AuthShell";
import SignupForm from "../../features/auth/components/SignupForm";

export default function RecruiterSignup() {
  return (
    <AuthShell
      eyebrow="Hiring workflow"
      steps={["Create your account", "Post an opening", "Screen applicants", "Make an offer"]}
      activeStep={0}
    >
      <SignupForm
        role="recruiter"
        heading="Hire your next team member"
        subheading="Post roles, screen applicants, and move candidates through one pipeline."
        switchTo={{ label: "Looking for a job?", to: "/signup/candidate", linkText: "Create a candidate account" }}
      />
    </AuthShell>
  );
}