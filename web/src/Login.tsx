import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Header } from './Layout';
import styles from './Login.module.css';
import { AppState } from "./store";

function Login() {
    const user = useSelector((state: AppState) => state.user.user);
    const navigate = useNavigate();
    const isLoggedIn = user !== null;

    const handleGitHub = () => {
        window.location.href = `${import.meta.env.BASE_URL}auth/github`;
    }
    const handleAnonymous = () => {
        navigate('/view');
    }

    return <>
        <Header>Login</Header>
        <LoginStatus user={user} />
        <div className={styles.gitHubButtonContainer}>
            <button className={styles.gitHubButton} onClick={handleGitHub} disabled={isLoggedIn}>Login with GitHub</button>
            <a href="#" className={styles.anonymousButton} onClick={handleAnonymous}>Continue without logging in</a>
        </div>
    </>
}

function LoginStatus(props: { user: string | null }) {
    if (props.user !== null) {
        return <div className={styles.loginStatus}>Current status: logged in as <strong>{props.user}</strong></div>;
    } else {
        return <div className={styles.loginStatus}>Current status: <strong>not logged in</strong></div>;
    }
}

export default Login;