import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToHash = () => {
    const { pathname, hash, key } = useLocation();

    useEffect(() => {
        // If there is a hash, scroll to the element
        if (hash) {
            // Small timeout to ensure content is rendered
            setTimeout(() => {
                const id = hash.replace('#', '');
                const element = document.getElementById(id);
                if (element) {
                    const headerHeight = 80; // Approximate header height
                    const offsetPosition = element.offsetTop - headerHeight;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        } else {
            // If no hash, scroll to top
            window.scrollTo(0, 0);
        }
    }, [pathname, hash, key]);

    return null;
};

export default ScrollToHash;
