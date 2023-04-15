import MessageLeft from "./MessageLeft";
import MessageRight from "./MessageRight";
import { useContext, useState, useEffect, useRef, useCallback } from "react";
import ChatContext from "../ChatContext";
import moment from "moment/moment";
import { auth, db } from '../firebase-config';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    collection,
    updateDoc,
    setDoc,
    where,
    query,
    getDocs,
    arrayUnion,
    or,
    onSnapshot,
} from "firebase/firestore";


export default function MessageSection() {

    const { contact } = useContext(ChatContext);

    const CollectionRef = collection(db, "messages");
    const [user, setUser] = useState(null);
    const editable = useRef(null);
    const [documentId, setDocumentId] = useState();
    const [messagesJson, setMessagesJson] = useState(null);


    const getMessagesArray = async () => {
        if (!contact || !user) {
            return;
        }
        console.log("ku");
        const movieMatch = query(CollectionRef, or(
            where("arrayName", '==', contact.email + user.email),
            where("arrayName", '==', user.email + contact.email)
        ));

        console.log(contact.email + user.email);

        const data = await getDocs(movieMatch);
        if (data.docs[0]) {
            // console.log(data.docs[0].id);
            setDocumentId(data.docs[0].id);
            setMessagesJson(data.docs[0].data().messagesArray);
        } else {
            setDocumentId(null);
            setMessagesJson(null);
            console.log("no such docss")
        }
    }

    function enterKey(e) {
        console.log("in")
        if (e.shiftKey && e.keyCode == 13) {
            console.log("Shift+Enter");
            // e.preventDefault();
        }
        if (e.keyCode == 13 && !e.shiftKey) {
            console.log("only Enter", user);
            sendMessage(editable.current.innerText);
            e.preventDefault();
        }
    }

    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, (currentUser) => {
            // console.log({ currentUser }) closure
            setUser(currentUser);
        });
        return subscriber;
    }, []);

    useEffect(() => {
        onSnapshot(CollectionRef, (snapshot) => {
            // console.log("snapshot", user)
            getMessagesArray();
        });
    }, [user, contact])

    useEffect(() => {
        getMessagesArray();
    }, [contact])

    function lastSeen(time) {
        var lastSeen = moment.unix(time);
        var currentDate = moment.unix(Math.floor(Date.now() / 1000));
        const deliveredTimeHour = lastSeen.format('HH');
        const deliveredTimeMinute = lastSeen.format('mm');

        //  console.log(lastSeen.format('dddd MMMM Do YYYY, HH:mm:ss '));

        if (currentDate.format('dddd MMMM Do YYYY') === lastSeen.format('dddd MMMM Do YYYY')) {
            return (
                <span>
                    last seen today at{' '}
                    {deliveredTimeHour}:{deliveredTimeMinute} {' '}
                </span>
            )
        }
        else if (currentDate.format('MMMM YYYY') === lastSeen.format('MMMM YYYY')
            &&
            ((currentDate.format('D') - lastSeen.format('D')) === 1)) {
            return (
                <span>
                    last seen yesterday at{' '}
                    {deliveredTimeHour}:{deliveredTimeMinute} {' '}
                </span>
            )
        }
        else if
            (currentDate.format('MMMM YYYY') === lastSeen.format('MMMM YYYY')
            &&
            (currentDate.format('D') - lastSeen.format('D') <= 4)) {
            return (
                <span>
                    last seen {lastSeen.format('dddd').toLowerCase()} at{' '}
                    {deliveredTimeHour}:{deliveredTimeMinute} {' '}
                </span>
            )
        }
        return (
            <span>
                last seen {lastSeen.format(' D/MM/YYYY')} at {deliveredTimeHour}:{deliveredTimeMinute} {' '}
            </span>
        )
    }

    if (!contact) {
        return (
            <div className="containerB">
                <div className="untilLoad">
                    <div>
                        <span >
                            {/* <svg viewBox="0 0 303 172" width="360" preserveAspectRatio="xMidYMid meet"  fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M229.565 160.229C262.212 149.245 286.931 118.241 283.39 73.4194C278.009 5.31929 212.365 -11.5738 171.472 8.48673C115.998 35.6999 108.972 40.1612 69.2388 40.1612C39.645 40.1612 9.51318 54.4147 5.7467 92.952C3.0166 120.885 13.9985 145.267 54.6373 157.716C128.599 180.373 198.017 170.844 229.565 160.229Z" fill="#DAF7F3"></path>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M131.589 68.9422C131.593 68.9422 131.596 68.9422 131.599 68.9422C137.86 68.9422 142.935 63.6787 142.935 57.1859C142.935 50.6931 137.86 45.4297 131.599 45.4297C126.518 45.4297 122.218 48.8958 120.777 53.6723C120.022 53.4096 119.213 53.2672 118.373 53.2672C114.199 53.2672 110.815 56.7762 110.815 61.1047C110.815 65.4332 114.199 68.9422 118.373 68.9422C118.377 68.9422 118.381 68.9422 118.386 68.9422H131.589Z" fill="white"></path>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M105.682 128.716C109.186 128.716 112.026 125.908 112.026 122.446C112.026 118.983 109.186 116.176 105.682 116.176C104.526 116.176 103.442 116.481 102.509 117.015L102.509 116.959C102.509 110.467 97.1831 105.203 90.6129 105.203C85.3224 105.203 80.8385 108.616 79.2925 113.335C78.6052 113.143 77.88 113.041 77.1304 113.041C72.7503 113.041 69.1995 116.55 69.1995 120.878C69.1995 125.207 72.7503 128.716 77.1304 128.716C77.1341 128.716 77.1379 128.716 77.1416 128.716H105.682L105.682 128.716Z" fill="white"></path>
                                <rect x="0.445307" y="0.549558" width="50.5797" height="100.068" rx="7.5" transform="matrix(0.994522 0.104528 -0.103907 0.994587 10.5547 41.6171)" fill="#42CBA5" stroke="#316474"></rect><rect x="0.445307" y="0.549558" width="50.4027" height="99.7216" rx="7.5" transform="matrix(0.994522 0.104528 -0.103907 0.994587 10.9258 37.9564)" fill="white" stroke="#316474"></rect><path d="M57.1609 51.7354L48.5917 133.759C48.2761 136.78 45.5713 138.972 42.5503 138.654L9.58089 135.189C6.55997 134.871 4.36688 132.165 4.68251 129.144L13.2517 47.1204C13.5674 44.0992 16.2722 41.9075 19.2931 42.2251L24.5519 42.7778L47.0037 45.1376L52.2625 45.6903C55.2835 46.0078 57.4765 48.7143 57.1609 51.7354Z" fill="#EEFEFA" stroke="#316474"></path>
                                <path d="M26.2009 102.937C27.0633 103.019 27.9323 103.119 28.8023 103.21C29.0402 101.032 29.2706 98.8437 29.4916 96.6638L26.8817 96.39C26.6438 98.5681 26.4049 100.755 26.2009 102.937ZM23.4704 93.3294L25.7392 91.4955L27.5774 93.7603L28.7118 92.8434L26.8736 90.5775L29.1434 88.7438L28.2248 87.6114L25.955 89.4452L24.1179 87.1806L22.9824 88.0974L24.8207 90.3621L22.5508 92.197L23.4704 93.3294ZM22.6545 98.6148C22.5261 99.9153 22.3893 101.215 22.244 102.514C23.1206 102.623 23.9924 102.697 24.8699 102.798C25.0164 101.488 25.1451 100.184 25.2831 98.8734C24.4047 98.7813 23.5298 98.6551 22.6545 98.6148ZM39.502 89.7779C38.9965 94.579 38.4833 99.3707 37.9862 104.174C38.8656 104.257 39.7337 104.366 40.614 104.441C41.1101 99.6473 41.6138 94.8633 42.1271 90.0705C41.2625 89.9282 40.3796 89.8786 39.502 89.7779ZM35.2378 92.4459C34.8492 96.2179 34.4351 99.9873 34.0551 103.76C34.925 103.851 35.7959 103.934 36.6564 104.033C37.1028 100.121 37.482 96.1922 37.9113 92.2783C37.0562 92.1284 36.18 92.0966 35.3221 91.9722C35.2812 92.1276 35.253 92.286 35.2378 92.4459ZM31.1061 94.1821C31.0635 94.341 31.0456 94.511 31.0286 94.6726C30.7324 97.5678 30.4115 100.452 30.1238 103.348L32.7336 103.622C32.8582 102.602 32.9479 101.587 33.0639 100.567C33.2611 98.5305 33.5188 96.4921 33.6905 94.4522C32.8281 94.3712 31.9666 94.2811 31.1061 94.1821Z" fill="#316474"></path>
                                <path d="M17.892 48.4889C17.7988 49.3842 18.4576 50.1945 19.3597 50.2923C20.2665 50.3906 21.0855 49.7332 21.1792 48.8333C21.2724 47.938 20.6136 47.1277 19.7115 47.0299C18.8047 46.9316 17.9857 47.5889 17.892 48.4889Z" fill="white" stroke="#316474"></path>
                                <path d="M231.807 136.678L197.944 139.04C197.65 139.06 197.404 139.02 197.249 138.96C197.208 138.945 197.179 138.93 197.16 138.918L196.456 128.876C196.474 128.862 196.5 128.843 196.538 128.822C196.683 128.741 196.921 128.668 197.215 128.647L231.078 126.285C231.372 126.265 231.618 126.305 231.773 126.365C231.814 126.381 231.842 126.395 231.861 126.407L232.566 136.449C232.548 136.463 232.522 136.482 232.484 136.503C232.339 136.584 232.101 136.658 231.807 136.678Z" fill="white" stroke="#316474"></path>
                                <path d="M283.734 125.679L144.864 135.363C141.994 135.563 139.493 133.4 139.293 130.54L133.059 41.6349C132.858 38.7751 135.031 36.2858 137.903 36.0856L276.773 26.4008C279.647 26.2005 282.144 28.364 282.345 31.2238L288.578 120.129C288.779 122.989 286.607 125.478 283.734 125.679Z" fill="white"></path>
                                <path d="M144.864 135.363C141.994 135.563 139.493 133.4 139.293 130.54L133.059 41.6349C132.858 38.7751 135.031 36.2858 137.903 36.0856L276.773 26.4008C279.647 26.2004 282.144 28.364 282.345 31.2238L288.578 120.129C288.779 122.989 286.607 125.478 283.734 125.679" stroke="#316474"></path>
                                <path d="M278.565 121.405L148.68 130.463C146.256 130.632 144.174 128.861 144.012 126.55L138.343 45.695C138.181 43.3846 139.994 41.3414 142.419 41.1723L272.304 32.1142C274.731 31.945 276.81 33.7166 276.972 36.0271L282.641 116.882C282.803 119.193 280.992 121.236 278.565 121.405Z" fill="#EEFEFA" stroke="#316474"></path>
                                <path d="M230.198 129.97L298.691 125.193L299.111 131.189C299.166 131.97 299.013 132.667 298.748 133.161C298.478 133.661 298.137 133.887 297.825 133.909L132.794 145.418C132.482 145.44 132.113 145.263 131.777 144.805C131.445 144.353 131.196 143.684 131.141 142.903L130.721 136.907L199.215 132.131C199.476 132.921 199.867 133.614 200.357 134.129C200.929 134.729 201.665 135.115 202.482 135.058L227.371 133.322C228.188 133.265 228.862 132.782 229.345 132.108C229.758 131.531 230.05 130.79 230.198 129.97Z" fill="#42CBA5" stroke="#316474"></path>
                                <path d="M230.367 129.051L300.275 124.175L300.533 127.851C300.591 128.681 299.964 129.403 299.13 129.461L130.858 141.196C130.025 141.254 129.303 140.627 129.245 139.797L128.987 136.121L198.896 131.245C199.485 132.391 200.709 133.147 202.084 133.051L227.462 131.281C228.836 131.185 229.943 130.268 230.367 129.051Z" fill="white" stroke="#316474"></path>
                                <ellipse rx="15.9969" ry="15.9971" transform="matrix(0.997577 -0.0695704 0.0699429 0.997551 210.659 83.553)" fill="#42CBA5" stroke="#316474"></ellipse><path d="M208.184 87.1094L204.777 84.3593C204.777 84.359 204.776 84.3587 204.776 84.3583C203.957 83.6906 202.744 83.8012 202.061 84.6073C201.374 85.4191 201.486 86.6265 202.31 87.2997L202.312 87.3011L207.389 91.4116C207.389 91.4119 207.389 91.4121 207.389 91.4124C208.278 92.1372 209.611 91.9373 210.242 90.9795L218.283 78.77C218.868 77.8813 218.608 76.6968 217.71 76.127C216.817 75.5606 215.624 75.8109 215.043 76.6939L208.184 87.1094Z" fill="white" stroke="#316474"></path>
                            </svg> */}

                            <svg viewBox="0 0 303 172" width="360" preserveAspectRatio="xMidYMid meet" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M229.565 160.229C262.212 149.245 286.931 118.241 283.39 73.4194C278.009 5.31929 212.365 -11.5738 171.472 8.48673C115.998 35.6999 108.972 40.1612 69.2388 40.1612C39.645 40.1612 9.51317 54.4147 5.74669 92.952C3.01662 120.885 13.9985 145.267 54.6373 157.716C128.599 180.373 198.017 170.844 229.565 160.229Z" fill="#364147"></path>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M131.589 68.9422C131.593 68.9422 131.596 68.9422 131.599 68.9422C137.86 68.9422 142.935 63.6787 142.935 57.1859C142.935 50.6931 137.86 45.4297 131.599 45.4297C126.518 45.4297 122.218 48.8958 120.777 53.6723C120.022 53.4096 119.213 53.2672 118.373 53.2672C114.199 53.2672 110.815 56.7762 110.815 61.1047C110.815 65.4332 114.199 68.9422 118.373 68.9422C118.377 68.9422 118.381 68.9422 118.386 68.9422H131.589Z" fill="#F1F1F2" fill-opacity="0.38"></path>
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M105.682 128.716C109.186 128.716 112.026 125.908 112.026 122.446C112.026 118.983 109.186 116.176 105.682 116.176C104.526 116.176 103.442 116.481 102.509 117.015L102.509 116.959C102.509 110.467 97.1831 105.203 90.6129 105.203C85.3224 105.203 80.8385 108.616 79.2925 113.335C78.6052 113.143 77.88 113.041 77.1304 113.041C72.7503 113.041 69.1995 116.55 69.1995 120.878C69.1995 125.207 72.7503 128.716 77.1304 128.716C77.1341 128.716 77.1379 128.716 77.1416 128.716H105.682L105.682 128.716Z" fill="#F1F1F2" fill-opacity="0.38"></path>
                                <rect x="0.445307" y="0.549558" width="50.5797" height="100.068" rx="7.5" transform="matrix(0.994522 0.104528 -0.103907 0.994587 10.5547 41.6171)" fill="#42CBA5" stroke="#316474"></rect>
                                <rect x="0.445307" y="0.549558" width="50.4027" height="99.7216" rx="7.5" transform="matrix(0.994522 0.104528 -0.103907 0.994587 10.9258 37.9564)" fill="#EEFAF6" stroke="#316474"></rect>
                                <path d="M57.1609 51.7354L48.5917 133.759C48.2761 136.78 45.5713 138.972 42.5503 138.654L9.58089 135.189C6.55997 134.871 4.36688 132.165 4.68251 129.144L13.2517 47.1204C13.5674 44.0992 16.2722 41.9075 19.2931 42.2251L24.5519 42.7778L47.0037 45.1376L52.2625 45.6903C55.2835 46.0078 57.4765 48.7143 57.1609 51.7354Z" fill="#DFF3ED" stroke="#316474"></path>
                                <path d="M26.2009 102.937C27.0633 103.019 27.9323 103.119 28.8023 103.21C29.0402 101.032 29.2706 98.8437 29.4916 96.6638L26.8817 96.39C26.6438 98.5681 26.4049 100.755 26.2009 102.937ZM23.4704 93.3294L25.7392 91.4955L27.5774 93.7603L28.7118 92.8434L26.8736 90.5775L29.1434 88.7438L28.2248 87.6114L25.955 89.4452L24.1179 87.1806L22.9824 88.0974L24.8207 90.3621L22.5508 92.197L23.4704 93.3294ZM22.6545 98.6148C22.5261 99.9153 22.3893 101.215 22.244 102.514C23.1206 102.623 23.9924 102.697 24.8699 102.798C25.0164 101.488 25.1451 100.184 25.2831 98.8734C24.4047 98.7813 23.5298 98.6551 22.6545 98.6148ZM39.502 89.7779C38.9965 94.579 38.4833 99.3707 37.9862 104.174C38.8656 104.257 39.7337 104.366 40.614 104.441C41.1101 99.6473 41.6138 94.8633 42.1271 90.0705C41.2625 89.9282 40.3796 89.8786 39.502 89.7779ZM35.2378 92.4459C34.8492 96.2179 34.4351 99.9873 34.0551 103.76C34.925 103.851 35.7959 103.934 36.6564 104.033C37.1028 100.121 37.482 96.1922 37.9113 92.2783C37.0562 92.1284 36.18 92.0966 35.3221 91.9722C35.2812 92.1276 35.253 92.286 35.2378 92.4459ZM31.1061 94.1821C31.0635 94.341 31.0456 94.511 31.0286 94.6726C30.7324 97.5678 30.4115 100.452 30.1238 103.348L32.7336 103.622C32.8582 102.602 32.9479 101.587 33.0639 100.567C33.2611 98.5305 33.5188 96.4921 33.6905 94.4522C32.8281 94.3712 31.9666 94.2811 31.1061 94.1821Z" fill="#316474"></path>
                                <path d="M17.892 48.4889C17.7988 49.3842 18.4576 50.1945 19.3597 50.2923C20.2665 50.3906 21.0855 49.7332 21.1792 48.8333C21.2724 47.938 20.6136 47.1277 19.7115 47.0299C18.8047 46.9316 17.9857 47.5889 17.892 48.4889Z" fill="white" stroke="#316474"></path><path d="M231.807 136.678L197.944 139.04C197.65 139.06 197.404 139.02 197.249 138.96C197.208 138.945 197.179 138.93 197.16 138.918L196.456 128.876C196.474 128.862 196.5 128.843 196.538 128.822C196.683 128.741 196.921 128.668 197.215 128.647L231.078 126.285C231.372 126.265 231.618 126.305 231.773 126.365C231.814 126.381 231.842 126.395 231.861 126.407L232.566 136.449C232.548 136.463 232.522 136.482 232.484 136.503C232.339 136.584 232.101 136.658 231.807 136.678Z" fill="white" stroke="#316474"></path>
                                <path d="M283.734 125.679L144.864 135.363C141.994 135.563 139.493 133.4 139.293 130.54L133.059 41.6349C132.858 38.7751 135.031 36.2858 137.903 36.0856L276.773 26.4008C279.647 26.2005 282.144 28.364 282.345 31.2238L288.578 120.129C288.779 122.989 286.607 125.478 283.734 125.679Z" fill="#EEFAF6"></path>
                                <path d="M144.864 135.363C141.994 135.563 139.493 133.4 139.293 130.54L133.059 41.6349C132.858 38.7751 135.031 36.2858 137.903 36.0856L276.773 26.4008C279.647 26.2004 282.144 28.364 282.345 31.2238L288.578 120.129C288.779 122.989 286.607 125.478 283.734 125.679" stroke="#316474"></path>
                                <path d="M278.565 121.405L148.68 130.463C146.256 130.632 144.174 128.861 144.012 126.55L138.343 45.695C138.181 43.3846 139.994 41.3414 142.419 41.1723L272.304 32.1142C274.731 31.945 276.81 33.7166 276.972 36.0271L282.641 116.882C282.803 119.193 280.992 121.236 278.565 121.405Z" fill="#DFF3ED" stroke="#316474"></path>
                                <path d="M230.198 129.97L298.691 125.193L299.111 131.189C299.166 131.97 299.013 132.667 298.748 133.161C298.478 133.661 298.137 133.887 297.825 133.909L132.794 145.418C132.482 145.44 132.113 145.263 131.777 144.805C131.445 144.353 131.196 143.684 131.141 142.903L130.721 136.907L199.215 132.131C199.476 132.921 199.867 133.614 200.357 134.129C200.929 134.729 201.665 135.115 202.482 135.058L227.371 133.322C228.188 133.265 228.862 132.782 229.345 132.108C229.758 131.531 230.05 130.79 230.198 129.97Z" fill="#42CBA5" stroke="#316474"></path>
                                <path d="M230.367 129.051L300.275 124.175L300.533 127.851C300.591 128.681 299.964 129.403 299.13 129.461L130.858 141.196C130.025 141.254 129.303 140.627 129.245 139.797L128.987 136.121L198.896 131.245C199.485 132.391 200.709 133.147 202.084 133.051L227.462 131.281C228.836 131.185 229.943 130.268 230.367 129.051Z" fill="#EEFAF6" stroke="#316474"></path>
                                <ellipse rx="15.9969" ry="15.9971" transform="matrix(0.997577 -0.0695704 0.0699429 0.997551 210.659 83.553)" fill="#42CBA5" stroke="#316474"></ellipse>
                                <path d="M208.184 87.1094L204.777 84.3593C204.777 84.359 204.776 84.3587 204.776 84.3583C203.957 83.6906 202.744 83.8012 202.061 84.6073C201.374 85.4191 201.486 86.6265 202.31 87.2997L202.312 87.3011L207.389 91.4116C207.389 91.4119 207.389 91.4121 207.389 91.4124C208.278 92.1372 209.611 91.9373 210.242 90.9795L218.283 78.77C218.868 77.8813 218.608 76.6968 217.71 76.127C216.817 75.5606 215.624 75.8109 215.043 76.6939L208.184 87.1094Z" fill="white" stroke="#316474"></path>
                            </svg>
                        </span>
                    </div>
                    <div >
                        <div >
                            <h1 style={{ color: "white" }}>WhatsApp Web</h1>
                        </div>
                        <br></br>
                        <div>Send and receive messages without keeping your phone online.
                            <br></br>
                            Use WhatsApp on up to 4 linked devices and 1 phone at the same time.</div>
                    </div>
                    <br></br>
                    <div >
                        <span >
                            <svg viewBox="0 0 10 12" fill="currentColor" height="12" width="10" preserveAspectRatio="xMidYMid meet" class="" version="1.1"><path d="M5.00847986,1.6 C6.38255462,1.6 7.50937014,2.67435859 7.5940156,4.02703389 L7.59911976,4.1906399 L7.599,5.462 L7.75719976,5.46214385 C8.34167974,5.46214385 8.81591972,5.94158383 8.81591972,6.53126381 L8.81591972,9.8834238 C8.81591972,10.4731038 8.34167974,10.9525438 7.75719976,10.9525438 L2.25767996,10.9525438 C1.67527998,10.9525438 1.2,10.4731038 1.2,9.8834238 L1.2,6.53126381 C1.2,5.94158383 1.67423998,5.46214385 2.25767996,5.46214385 L2.416,5.462 L2.41679995,4.1906399 C2.41679995,2.81636129 3.49135449,1.68973395 4.84478101,1.60510326 L5.00847986,1.6 Z M5.00847986,2.84799995 C4.31163824,2.84799995 3.73624912,3.38200845 3.6709675,4.06160439 L3.6647999,4.1906399 L3.663,5.462 L6.35,5.462 L6.35111981,4.1906399 C6.35111981,3.53817142 5.88169076,2.99180999 5.26310845,2.87228506 L5.13749818,2.85416626 L5.00847986,2.84799995 Z"></path>
                            </svg>
                        </span>
                        {" "}End-to-end encrypted
                    </div>
                </div>
            </div >
        )
    }


    const sendMessage = async (message) => {
        const epoch_time = Math.floor(Date.now() / 1000);
        if (!message) {
            return (console.log("emptyMessage"));
        }

        if (documentId) {
            console.log("update", message)
            const Doc = doc(db, "messages", documentId);
            const newField = {
                messagesArray: arrayUnion({
                    sender: user.email,
                    msng: message,
                    createdAt: epoch_time,
                })
            };
            await updateDoc(Doc, newField);
        } else {
            console.log("new")
            await setDoc(doc(CollectionRef, user.email + contact.email), {
                arrayName: user.email + contact.email,
                messagesArray: [
                    {
                        sender: user.email,
                        msng: message,
                        createdAt: epoch_time
                    },
                ]
            });
        }
        editable.current.innerText = "";
    };

    if (!messagesJson && contact) {
        return (
            < div className='containerB'>
                <div className='profileBar'>
                    <div className='profileDisplayPicture'>
                        <img src={contact.imgLink}></img>
                    </div>

                    <div className='profileDetails '>
                        <div >
                            <span className='font16'>{contact.name}</span>
                        </div>
                        <div className='messageOptions'>
                            <span className='font12 '>{lastSeen(contact.lastSeen)}</span>
                        </div>
                    </div>

                    <div className='profileOptions'>
                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" class=""  ><path fill='currentColor' d="M15.9,14.3H15L14.7,14c1-1.1,1.6-2.7,1.6-4.3c0-3.7-3-6.7-6.7-6.7S3,6,3,9.7 s3,6.7,6.7,6.7c1.6,0,3.2-0.6,4.3-1.6l0.3,0.3v0.8l5.1,5.1l1.5-1.5L15.9,14.3z M9.7,14.3c-2.6,0-4.6-2.1-4.6-4.6s2.1-4.6,4.6-4.6 s4.6,2.1,4.6,4.6S12.3,14.3,9.7,14.3z"></path></svg>
                        <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" class="" fill="none"><path fill="currentColor" d="M12,7c1.104,0,2-0.896,2-2c0-1.105-0.895-2-2-2c-1.104,0-2,0.894-2,2 C10,6.105,10.895,7,12,7z M12,9c-1.104,0-2,0.894-2,2c0,1.104,0.895,2,2,2c1.104,0,2-0.896,2-2C13.999,9.895,13.104,9,12,9z M12,15 c-1.104,0-2,0.894-2,2c0,1.104,0.895,2,2,2c1.104,0,2-0.896,2-2C13.999,15.894,13.104,15,12,15z"></path></svg>
                    </div>
                </div>

                <div className="chatMessages">
                </div>

                <div className='footer'>
                    <div className='messageBox' >
                        <div className='messageBoxSub'>
                            <div className='messageBoxA'>
                                <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M9.153,11.603c0.795,0,1.439-0.879,1.439-1.962S9.948,7.679,9.153,7.679 S7.714,8.558,7.714,9.641S8.358,11.603,9.153,11.603z M5.949,12.965c-0.026-0.307-0.131,5.218,6.063,5.551 c6.066-0.25,6.066-5.551,6.066-5.551C12,14.381,5.949,12.965,5.949,12.965z M17.312,14.073c0,0-0.669,1.959-5.051,1.959 c-3.505,0-5.388-1.164-5.607-1.959C6.654,14.073,12.566,15.128,17.312,14.073z M11.804,1.011c-6.195,0-10.826,5.022-10.826,11.217 s4.826,10.761,11.021,10.761S23.02,18.423,23.02,12.228C23.021,6.033,17.999,1.011,11.804,1.011z M12,21.354 c-5.273,0-9.381-3.886-9.381-9.159s3.942-9.548,9.215-9.548s9.548,4.275,9.548,9.548C21.381,17.467,17.273,21.354,12,21.354z  M15.108,11.603c0.795,0,1.439-0.879,1.439-1.962s-0.644-1.962-1.439-1.962s-1.439,0.879-1.439,1.962S14.313,11.603,15.108,11.603z"></path></svg>
                                <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M1.816,15.556v0.002c0,1.502,0.584,2.912,1.646,3.972s2.472,1.647,3.974,1.647 c1.501,0,2.91-0.584,3.972-1.645l9.547-9.548c0.769-0.768,1.147-1.767,1.058-2.817c-0.079-0.968-0.548-1.927-1.319-2.698 c-1.594-1.592-4.068-1.711-5.517-0.262l-7.916,7.915c-0.881,0.881-0.792,2.25,0.214,3.261c0.959,0.958,2.423,1.053,3.263,0.215 c0,0,3.817-3.818,5.511-5.512c0.28-0.28,0.267-0.722,0.053-0.936c-0.08-0.08-0.164-0.164-0.244-0.244 c-0.191-0.191-0.567-0.349-0.957,0.04c-1.699,1.699-5.506,5.506-5.506,5.506c-0.18,0.18-0.635,0.127-0.976-0.214 c-0.098-0.097-0.576-0.613-0.213-0.973l7.915-7.917c0.818-0.817,2.267-0.699,3.23,0.262c0.5,0.501,0.802,1.1,0.849,1.685 c0.051,0.573-0.156,1.111-0.589,1.543l-9.547,9.549c-0.756,0.757-1.761,1.171-2.829,1.171c-1.07,0-2.074-0.417-2.83-1.173 c-0.755-0.755-1.172-1.759-1.172-2.828l0,0c0-1.071,0.415-2.076,1.172-2.83c0,0,5.322-5.324,7.209-7.211 c0.157-0.157,0.264-0.579,0.028-0.814c-0.137-0.137-0.21-0.21-0.342-0.342c-0.2-0.2-0.553-0.263-0.834,0.018 c-1.895,1.895-7.205,7.207-7.205,7.207C2.4,12.645,1.816,14.056,1.816,15.556z"></path></svg>
                            </div>

                            <div className='messageBoxB'>
                                <div onKeyDown={enterKey} contentEditable="true" className='messageInputBox' data-lexical-editor="true" role='textbox' title="Type a message "
                                    ref={editable}></div>
                            </div>


                            <div className='messageBoxC'>
                                <div className='micIcon'
                                    onClick={() => {
                                        sendMessage(editable.current.innerText)
                                    }}>
                                    <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
                                </div>


                                <div className='micIcon'>
                                    <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M11.999,14.942c2.001,0,3.531-1.53,3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531 S8.469,2.35,8.469,4.35v7.061C8.469,13.412,9.999,14.942,11.999,14.942z M18.237,11.412c0,3.531-2.942,6.002-6.237,6.002 s-6.237-2.471-6.237-6.002H3.761c0,4.001,3.178,7.297,7.061,7.885v3.884h2.354v-3.884c3.884-0.588,7.061-3.884,7.061-7.885 L18.237,11.412z"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        )
    }

    messagesJson.sort(function (a, b) {
        return b.createdAt - a.createdAt;
    });

    return (
        < div className='containerB'>

            <div className='profileBar'>
                <div className='profileDisplayPicture'>
                    <img src={contact.imgLink}></img>
                </div>

                <div className='profileDetails '>
                    <div >
                        <span className='font16'>{contact.name}</span>
                    </div>
                    <div className='messageOptions'>
                        <span className='font12 '>{lastSeen(contact.lastSeen)}</span>
                    </div>
                </div>

                <div className='profileOptions'>
                    <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet"   ><path fill='currentColor' d="M15.9,14.3H15L14.7,14c1-1.1,1.6-2.7,1.6-4.3c0-3.7-3-6.7-6.7-6.7S3,6,3,9.7 s3,6.7,6.7,6.7c1.6,0,3.2-0.6,4.3-1.6l0.3,0.3v0.8l5.1,5.1l1.5-1.5L15.9,14.3z M9.7,14.3c-2.6,0-4.6-2.1-4.6-4.6s2.1-4.6,4.6-4.6 s4.6,2.1,4.6,4.6S12.3,14.3,9.7,14.3z"></path></svg>
                    <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M12,7c1.104,0,2-0.896,2-2c0-1.105-0.895-2-2-2c-1.104,0-2,0.894-2,2 C10,6.105,10.895,7,12,7z M12,9c-1.104,0-2,0.894-2,2c0,1.104,0.895,2,2,2c1.104,0,2-0.896,2-2C13.999,9.895,13.104,9,12,9z M12,15 c-1.104,0-2,0.894-2,2c0,1.104,0.895,2,2,2c1.104,0,2-0.896,2-2C13.999,15.894,13.104,15,12,15z"></path></svg>
                </div>
            </div>

            <div className="chatMessages">
                {messagesJson.map(function (message, i) {
                    var tailCheck = (messagesJson[i + 1] && messagesJson[i + 1].sender === user.email);
                    if (message.sender === user.email) {
                        return (
                            <div key={i}>
                                <MessageRight message={message.msng} time={message.createdAt} tailCheck={tailCheck} />
                            </div>
                        )
                    }
                    return (
                        <div key={i} >
                            <MessageLeft message={message.msng} time={message.createdAt} tailCheck={tailCheck} />
                        </div>
                    )
                })}
            </div>

            <div className='footer'>
                <div className='messageBox' >
                    <div className='messageBoxSub'>
                        <div className='messageBoxA'>
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M9.153,11.603c0.795,0,1.439-0.879,1.439-1.962S9.948,7.679,9.153,7.679 S7.714,8.558,7.714,9.641S8.358,11.603,9.153,11.603z M5.949,12.965c-0.026-0.307-0.131,5.218,6.063,5.551 c6.066-0.25,6.066-5.551,6.066-5.551C12,14.381,5.949,12.965,5.949,12.965z M17.312,14.073c0,0-0.669,1.959-5.051,1.959 c-3.505,0-5.388-1.164-5.607-1.959C6.654,14.073,12.566,15.128,17.312,14.073z M11.804,1.011c-6.195,0-10.826,5.022-10.826,11.217 s4.826,10.761,11.021,10.761S23.02,18.423,23.02,12.228C23.021,6.033,17.999,1.011,11.804,1.011z M12,21.354 c-5.273,0-9.381-3.886-9.381-9.159s3.942-9.548,9.215-9.548s9.548,4.275,9.548,9.548C21.381,17.467,17.273,21.354,12,21.354z  M15.108,11.603c0.795,0,1.439-0.879,1.439-1.962s-0.644-1.962-1.439-1.962s-1.439,0.879-1.439,1.962S14.313,11.603,15.108,11.603z"></path></svg>
                            <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M1.816,15.556v0.002c0,1.502,0.584,2.912,1.646,3.972s2.472,1.647,3.974,1.647 c1.501,0,2.91-0.584,3.972-1.645l9.547-9.548c0.769-0.768,1.147-1.767,1.058-2.817c-0.079-0.968-0.548-1.927-1.319-2.698 c-1.594-1.592-4.068-1.711-5.517-0.262l-7.916,7.915c-0.881,0.881-0.792,2.25,0.214,3.261c0.959,0.958,2.423,1.053,3.263,0.215 c0,0,3.817-3.818,5.511-5.512c0.28-0.28,0.267-0.722,0.053-0.936c-0.08-0.08-0.164-0.164-0.244-0.244 c-0.191-0.191-0.567-0.349-0.957,0.04c-1.699,1.699-5.506,5.506-5.506,5.506c-0.18,0.18-0.635,0.127-0.976-0.214 c-0.098-0.097-0.576-0.613-0.213-0.973l7.915-7.917c0.818-0.817,2.267-0.699,3.23,0.262c0.5,0.501,0.802,1.1,0.849,1.685 c0.051,0.573-0.156,1.111-0.589,1.543l-9.547,9.549c-0.756,0.757-1.761,1.171-2.829,1.171c-1.07,0-2.074-0.417-2.83-1.173 c-0.755-0.755-1.172-1.759-1.172-2.828l0,0c0-1.071,0.415-2.076,1.172-2.83c0,0,5.322-5.324,7.209-7.211 c0.157-0.157,0.264-0.579,0.028-0.814c-0.137-0.137-0.21-0.21-0.342-0.342c-0.2-0.2-0.553-0.263-0.834,0.018 c-1.895,1.895-7.205,7.207-7.205,7.207C2.4,12.645,1.816,14.056,1.816,15.556z"></path></svg>
                        </div>

                        <div className='messageBoxB'>
                            <div onKeyDown={enterKey} contentEditable="true" className='messageInputBox' data-lexical-editor="true" role='textbox' title="Type a message "
                                ref={editable}></div>
                        </div>


                        <div className='messageBoxC'>
                            <div className='micIcon'
                                onClick={() => {
                                    sendMessage(editable.current.innerText)
                                }}>
                                <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M1.101,21.757L23.8,12.028L1.101,2.3l0.011,7.912l13.623,1.816L1.112,13.845 L1.101,21.757z"></path></svg>
                            </div>


                            <div className='micIcon'>
                                <svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="none"><path fill="currentColor" d="M11.999,14.942c2.001,0,3.531-1.53,3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531 S8.469,2.35,8.469,4.35v7.061C8.469,13.412,9.999,14.942,11.999,14.942z M18.237,11.412c0,3.531-2.942,6.002-6.237,6.002 s-6.237-2.471-6.237-6.002H3.761c0,4.001,3.178,7.297,7.061,7.885v3.884h2.354v-3.884c3.884-0.588,7.061-3.884,7.061-7.885 L18.237,11.412z"></path></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div >
    );
}


