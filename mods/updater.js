// TizenTube Cobalt Update Checker

import { buttonItem, showModal, showToast } from './ytUI.js';
import { configRead } from './config.js';

// If TizenTube is not running on Cobalt, do nothing
if (window.h5vcc && window.h5vcc.tizentube) {
    const currentAppVersion = window.h5vcc.tizentube.GetVersion();

    function getLatestRelease() {
        return fetch('https://api.github.com/repos/daivietpda/TizenTubeCobalt/releases/latest')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Phản hồi của mạng không ổn');
                }
                return response.json();
            });
    }

    const currentEpoch = Math.floor(Date.now() / 1000);
    if (configRead('dontCheckUpdateUntil') > currentEpoch) {
        console.info('Skipping update check until', new Date(configRead('dontCheckUpdateUntil') * 1000).toLocaleString());
    } else checkForUpdates();

    function checkForUpdates() {
        getLatestRelease()
            .then(release => {
                const latestVersion = release.tag_name.replace('v', '');
                const releaseDate = new Date(release.published_at).getTime() / 1000;

                if (latestVersion !== currentAppVersion) {
                    console.info(`Phiên bản mới có sẵn: ${latestVersion} (Hiện tại: ${currentAppVersion})`);

                    // Create buttons for each asset
                    const assetButtons = release.assets.map(asset => {
                        return buttonItem(
                            { title: asset.name, subtitle: `Kích thước: ${(asset.size / (1024 * 1024)).toFixed(2)} MB` },
                            { icon: 'DOWN_ARROW' },
                            [
                                {
                                    customAction: {
                                        action: 'UPDATE_DOWNLOAD',
                                        parameters: asset.browser_download_url
                                    }
                                },
                                {
                                    signalAction: {
                                        signal: 'POPUP_BACK'
                                    }
                                }
                            ]
                        );
                    });

                    // Add "Remind me later" button
                    assetButtons.push(
                        buttonItem(
                            { title: 'Nhắc tôi sau', subtitle: 'Kiểm tra cập nhật sau.' },
                            { icon: 'SEARCH_HISTORY' },
                            [
                                {
                                    customAction: {
                                        action: 'UPDATE_REMIND_LATER',
                                        parameters: currentEpoch + 86400
                                    }
                                },
                                {
                                    signalAction: {
                                        signal: 'POPUP_BACK'
                                    }
                                }
                            ]
                        )
                    );


                    showModal(
                        {
                            title: 'Cập nhật có sẵn',
                            subtitle: `Phiên bản mới của TizenTube Cobalt đã có sẵn: ${latestVersion}\nPhiên bản hiện tại: ${currentAppVersion}\nNgày phát hành: ${new Date(releaseDate * 1000).toLocaleString()}\nGhi chú phát hành:\n${release.body}\n\nVui lòng chọn file để tải xuống:`
                        },
                        assetButtons, // Pass the array of asset buttons
                        0,
                        'tt-update-modal'
                    )
                } else {
                    console.info('Bạn đang sử dụng phiên bản mới nhất của TizenTube.');
                }
            })
            .catch(error => {
                console.error('Lỗi khi tải bản phát hành mới nhất:', error);
                showToast('TizenTube Kiểm tra cập nhật không thành công', 'Không thể kiểm tra cập nhật.', null);
            });
    }
}